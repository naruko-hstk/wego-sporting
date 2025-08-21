# 新版建立賽事 API 範例

```
curl --location 'http://localhost:3000/api/games' \
--header 'Content-Type: application/json' \
--data '{
  "name": "114年永慶盃全國跆拳道錦標賽",
  "region": "chiayi-country",
  "venue": "嘉義縣立永慶高級中學晨曦館",
  "address": "612嘉義縣太保市信義二路1號",
  "signupStart": "2025-07-01",
  "signupEnd": "2025-07-27",
  "gameStart": "2025-08-16",
  "gameEnd": "2025-08-17",
  "basis": "依據中華民國跆拳道協會最新競賽規則",
  "note": "（公開組賽程全部採用Deado Gen2電子護具）",
  "categories": [
    { "categoryType": "品勢", "categoryName": "品勢-個人品勢" },
    { "categoryType": "品勢", "categoryName": "品勢-雙人品勢" },
    { "categoryType": "品勢", "categoryName": "品勢-團體品勢" },
    { "categoryType": "對練", "categoryName": "對練-幼稚園男子組" },
    { "categoryType": "對練", "categoryName": "對練-幼稚園女子組" },
    { "categoryType": "擊破", "categoryName": "擊破-低年級色帶男子組" }
    // ... 其餘組別
  ],
  "fees": [
    { "categoryType": "品勢", "feeType": "品勢報名費", "amount": 400 },
    { "categoryType": "對練", "feeType": "對練報名費", "amount": 600 },
    { "categoryType": "擊破", "feeType": "擊破報名費", "amount": 300 }
  ]
}'
```

- categories 陣列：每筆需有 categoryType（項目分類）與 categoryName（完整項目名）
- fees 陣列：每筆需有 categoryType（對應項目分類）、feeType、amount
- 若要自動產生所有組別的費用，後端可根據 categoryType 自動對應

請依此格式調整前端或測試資料。
