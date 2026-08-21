# ラーメン パーフェクトタイマー

カップラーメンのパッケージを撮るだけで、その商品にとって「完璧な待ち時間」がわかる
Next.js アプリ。撮影 → 商品特定 → タイマー → 待っている間のクイズ、までを 1 画面で完結させる。

画像認識は **ローカルの Ollama を既定**とし、失敗・低確信度のときだけ **Gemini にフォールバック**する。
どちらも使えない場合は手動検索へ誘導するので、**API キーなしでも動く**。

## 必要なもの

| | バージョン | 必須 |
|---|---|---|
| Node.js | 20 以上（CI は 20） | 必須 |
| npm | Node 20 同梱のもの | 必須 |
| Ollama (ollama.com) | 任意 | 任意（画像認識に使う） |
| Gemini API キー | 任意 | 任意（フォールバックに使う） |

Ollama も Gemini も無い状態でも `npm run dev` は起動し、手動検索でタイマーまで到達できる。

## セットアップ

```bash
git clone git@github.com:terisuke/ramen-perfectimer.git
cd ramen-perfectimer
npm ci
npm run dev
```

ブラウザで `localhost:3000` を開く。

## 画像認識の構成

`POST /api/identify` は次の順で商品を特定する（`src/app/api/identify/route.ts`）。

1. **Ollama（既定）** — `localhost:11434/api/chat` の `gemma4:e2b` に画像を送る。
   タイムアウトは 15 秒。`confidence > 0.7` なら採用し、レスポンスの `engine` は `gemma4`。
2. **Gemini（フォールバック）** — 1 が失敗・`id: null`・`confidence <= 0.7` のときだけ実行する。
   `GEMINI_API_KEY` が未設定ならこの段は即 `null` を返して次へ進む。
   採用時の `engine` は `gemini`。
3. **手動検索** — 1 も 2 も決められない場合、`404` と `suggestion: "manual"` を返す。
   UI は手動検索（`GET /api/products?q=`）へ誘導する。

### Ollama を使う場合

```bash
# 1. Ollama を入れる（macOS）
brew install ollama

# 2. サーバを起動する（別ターミナルで動かしたままにする）
ollama serve

# 3. アプリが呼ぶモデルを取得する
ollama pull gemma4:e2b

# 4. 応答するか確認する
curl localhost:11434/api/tags
```

`ollama serve` が動いていない場合、`/api/identify` は Ollama 段を諦めて次段へ進むだけで、
アプリは落ちない。

### Gemini フォールバックを使う場合

1. Google AI Studio（`aistudio.google.com/app/apikey`）でキーを発行する。
2. `.env.local` に書く（**キーはリポジトリにコミットしない**）。

```bash
GEMINI_API_KEY=your-key-here
```

3. `npm run dev` を再起動する。

モデルは `gemini-2.0-flash`。Gemini の呼び出しは**課金対象**になりうるので、
不要なら `GEMINI_API_KEY` を設定しないままにしておく。

## 環境変数

| 変数 | 必須 | 既定 | 用途 |
|---|---|---|---|
| `GEMINI_API_KEY` | 任意 | 未設定 | 未設定なら Gemini フォールバックを行わず手動検索へ誘導する |

未設定でもアプリは動く。使う場合だけ、リポジトリ直下に `.env.local`
（`.gitignore` 済み）を作って 1 行書く。

```bash
GEMINI_API_KEY=your-key-here
```

`.env.local` は決してコミットしない。

## スクリプト

```bash
npm run dev     # 開発サーバ (localhost:3000)
npm run build   # 本番ビルド。tests/ も型検査される
npm start       # build 済み成果物を起動
npm run lint    # next lint
npm test        # vitest run（ネットワーク不要）
```

CI（`.github/workflows/ci.yml`）は pull request と main への push で
`npm ci → lint → test → build` を実行する。テスト方針は `tests/README.md`。

## PWA

`public/manifest.json` と `public/icon.svg` を配信し、`src/app/layout.tsx` の
`metadata.manifest` / `metadata.icons` から参照する。`standalone` 表示、
テーマ色 `#FF8C00`、`purpose` は `any` と `maskable` の 2 件を宣言する。

アイコンは単一の SVG（`sizes: "any"`）。インストール可否の実機確認は未実施で、
オフライン動作（Service Worker）は**未実装**。

## 構成

```
src/
  app/
    api/identify/route.ts   画像 → 商品特定（Ollama → Gemini → 手動）
    api/products/route.ts   商品検索（手動検索の裏側）
    layout.tsx / page.tsx
  components/               CameraView / ManualSearch / ResultView / TimerView
  data/                     products.json / quizzes.json
  lib/                      types.ts / media-stream.ts
tests/                      vitest（tests/README.md に方針）
public/                     manifest.json / icon.svg
```

## 既知の限界

- 商品データは `src/data/products.json` の固定リスト。ここに無い商品は特定できない。
- `gemma4:e2b` の日本語 OCR 精度は限定的（Issue #2）。
- Service Worker とオフライン対応は未実装。
- 実機（スマホ）での操作感・PWA インストールは未検証（Issue #3）。
