# ブラウザアイコン（favicon）のサイズ

切り抜き元は **正方形** で作ると安全です。

## 用意するサイズ（おすすめ）

| ファイル | サイズ | 用途 |
|----------|--------|------|
| `public/favicon.ico` | 32×32（中に16も入れられる） | 古いブラウザ・タブ |
| `public/favicon-32.png` | **32×32** | タブ（いちばんよく使う） |
| `public/favicon-192.png` | 192×192 | Android ホーム画面など |
| `public/apple-touch-icon.png` | **180×180** | iPhone のホーム画面 |

**まず1枚だけなら `512×512` の PNG を1枚作り、** 画像ツールで 32px と 180px に縮小コピーでも十分です。

## 設定後（`index.html` の例）

```html
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
```

SVG（`mark.svg`）は小さいサイズでは潰れやすいので、切り抜きロゴは **PNG 推奨** です。
