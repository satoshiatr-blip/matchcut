# MATCHCUT

保護者がiPhoneで撮った試合動画を、プロの試合のハイライト風に編集するPWA。
動画の読み込み・編集・書き出しはすべて端末内で行い、外部へは送信しない。

- 使う: https://satoshiatr-blip.github.io/matchcut/ （Safariで開き「ホーム画面に追加」）
- 技術: Vite + React + TypeScript + Tailwind CSS、[mediabunny](https://github.com/Vanilagy/mediabunny)（WebCodecs）

## 開発

```bash
npm install
npm run dev -- --mode pc   # PCのブラウザで確認（http://localhost:5177）
npm run dev                # iPhone実機でLAN越しに確認（https、port 5176）
```
