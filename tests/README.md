# テスト方針

## 実行

```bash
npm test          # vitest run（Node 20、ネットワーク不要）
npm run lint
npm run build     # tests/ も tsconfig の include 対象なので型検査される
```

CI（`.github/workflows/ci.yml`）は pull request と main への push で
`npm ci → lint → test → build` を実行する。

## 現在のカバー範囲

| 対象 | ファイル | 拾う回帰 |
|---|---|---|
| `GET /api/products` | `tests/api/products.test.ts` | 検索対象フィールドの脱落、大文字小文字正規化の欠落、レスポンス射影の崩れ |
| `POST /api/identify` | `tests/api/identify.test.ts` | upload validation（`image` が File でない場合の 400 NO_IMAGE）、エラー封筒の形 |

Route handler は Next.js サーバーを起動せず、`NextRequest` を直接渡して
関数として呼ぶ。`identify` のテストは `fetch` を stub し `GEMINI_API_KEY` を
削除するため、Ollama にも Gemini にも接触しない。

## テストは「壊したら red になる」ことまで確認する

assertion を書いただけでは、バグが入っても green のままになりうる。
実際にこのリポジトリで一度起きている: 射影テストの初版は無フィルタ分岐しか
検査しておらず、フィルタ側の射影を外しても 22 件すべて green だった。

新しいテストを追加するときは、対応するバグを一時的に注入して red になることを
確認してから commit する。分岐が複数ある処理は、分岐ごとに検査する
（`describe.each` を使う）。

## コンポーネントのスモークテスト方針（未実装）

Issue #5 が挙げるもう一方の回帰 **camera cleanup**（`CameraView.tsx` の
`getUserMedia` で取得した MediaStream を unmount / 再取得時に停止する）は、
現時点では自動検証していない。理由と着地方針を残す。

- 実カメラ権限とデバイスは CI に無い。`navigator.mediaDevices` を差し替えた
  ユニットテストで「`stream.getTracks()[0].stop()` が呼ばれる」ことは検査できるが、
  それは実機でストリームが実際に解放されることの証明にはならない。
  この境界の反証には実画面での確認が要る。
- したがって段階を分ける。
  1. `jsdom` 環境と Testing Library を足し、`navigator.mediaDevices.getUserMedia` を
     stub して unmount 時の `stop()` 呼び出しと、エラー時の loading 状態復帰を検査する。
     ここまでは CI で回せる。
  2. 実機での確認は手動チェックリストとして残し、テスト green を実機検証の
     代わりにしない。
- 1 は本 PR の scope 外とする。API 回帰と CI 自動化を先に着地させ、
  ブラウザ環境の依存追加（`jsdom` / `@testing-library/react`）は
  別 PR で単一の意図として扱う。
