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
| MediaStream cleanup | `tests/lib/media-stream.test.ts` | cleanup関数が全trackを`stop()`し、stream未設定を許容すること |

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

## コンポーネントのスモークテスト方針

Issue #5 が挙げるもう一方の回帰 **camera cleanup**（`CameraView.tsx` の
`getUserMedia` で取得した MediaStream を unmount 時に停止する）は、
純粋関数`stopMediaTracks()`とMediaStream stubで自動検証する。

- 実カメラ権限とデバイスは CI に無い。`navigator.mediaDevices` を差し替えた
  ユニットテストで「`stream.getTracks()[0].stop()` が呼ばれる」ことは検査できるが、
  それは実機でストリームが実際に解放されることの証明にはならない。
  この境界の反証には実画面での確認が要る。
- テストは2本のtrackを返すstubを設定し、cleanup関数の呼び出し後に各trackの
  `stop()`が1回になることを固定する。関数内の`stop()`呼び出しを外すとredに
  なることをPhase 18で実測した。
- 実機でストリームが本当に解放されることはこのstubテストでは証明しない。
  また、`CameraView`のunmount cleanupがこの関数を呼ぶ配線も自動テスト対象外である。
  Vitest 4がNext.jsの`jsx: preserve` TSXをNode test環境で変換できず、同じparse
  failureを3回実測したため、配線はコードレビューによる目視確認の既知限界として残す。
