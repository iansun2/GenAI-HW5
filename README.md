# 星軌大亨 Orbital Tycoon

回合制衛星發射經營模擬遊戲。競標合約、用 Δv 計算自由組裝火箭、研發科技樹、部署自有星座,並與三家 AI 對手爭奪軌道與市場。

## 執行

- **本機**:直接雙擊 `index.html` 即可(不需要伺服器、Node.js 或任何建置步驟)。
- **GitHub Pages**:repo → Settings → Pages → Source 選 `main` 分支、根目錄 `/`,存檔後即可在 `https://<帳號>.github.io/<repo>/` 遊玩。

存檔存在瀏覽器 localStorage(每月自動存檔 + 3 個手動存檔槽),也可從選單匯出 / 匯入 JSON 檔。

## 檔案結構

```
index.html          入口,依序以 <script> 載入所有檔案(不用 ES Modules,才能在 file:// 下執行)
css/style.css       科幻儀表板樣式
js/core/            遊戲邏輯(與畫面無關):火箭計算、財務、合約、軌道、對手 AI、事件、回合結算
js/data/            遊戲資料:平衡參數、組件、科技樹、軌道、衛星、事件
js/ui/              畫面與互動
```

調整難度請改 `js/data/balance.js`,規格說明見 `SPEC.md`。
