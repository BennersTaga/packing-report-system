# packing-report-system
梱包日報管理システム

## Mock Shipment ページの確認

開発用のモック出荷ページ `/mock/shipment` を利用するには `.env.local` に `GAS_ENDPOINT=<GAS WebApp URL>` を設定してください（このファイルはコミットしないでください）。
設定後 `npm run dev` を実行し、ブラウザで `http://localhost:3000/mock/shipment` にアクセスして動作を確認します。
