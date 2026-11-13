// Khóa cuộn trang phía sau popup tìm kiếm / menu điện thoại mà không làm giật bố cục:
// ẩn thanh cuộn thì trang rộng thêm đúng bề rộng thanh cuộn → bù bằng padding-right cho <html>
// và biến --lock-gap cho phần cố định (thanh đầu trang, nút lên đầu trang). Đếm số nơi đang khóa để mở đúng lúc
let locks = 0;

export function lockScroll() {
  const html = document.documentElement;
  if (locks++ === 0) {
    const gap = window.innerWidth - html.clientWidth; // 0 trên điện thoại (thanh cuộn nổi)
    html.style.setProperty("--lock-gap", `${gap}px`);
    html.style.paddingRight = gap ? `${gap}px` : "";
    html.style.overflow = "hidden";
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) {
      html.style.overflow = "";
      html.style.paddingRight = "";
      html.style.removeProperty("--lock-gap");
    }
  };
}
