// Kích thước trang chủ web thu nhỏ trong khung xem trước (components/site-theme/preview-page.tsx): bề ngang trang, chiều cao hero,
// chiều cao thanh điều hướng trên hero / khi đã cuộn qua (như fe/src/components/site-header.tsx)
export const PAGE = {
  desktop: { w: 1280, hero: 800, bar: 100, solidBar: 64 },
  mobile: { w: 390, hero: 680, bar: 72, solidBar: 64 },
};
export type Device = keyof typeof PAGE;
