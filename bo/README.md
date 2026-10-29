# 2510 Back office

Trang quản trị của 2510 Scented Candle — React + Vite + React Router + Ant Design 6.

```bash
pnpm install
pnpm dev       # http://localhost:3001
pnpm build     # type-check + build ra dist/
pnpm preview   # chạy thử bản build
```

- Theme antd (màu thương hiệu, font) ở `src/theme.ts`; menu ở `src/layouts/nav.tsx`.
- Dữ liệu dashboard và nguyên liệu Thủ công hiện là dữ liệu mẫu (`src/lib/mock.ts`, `src/lib/craft/catalog.mock.ts`).
  Cấu hình Thủ công lưu tạm trên trình duyệt (`src/hooks/use-craft-catalog.ts`) cho tới khi có API.
- Khi deploy dạng SPA, cấu hình server trả `index.html` cho mọi đường dẫn (vd `/craft`).
