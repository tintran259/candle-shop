// Khóa cuộn trang phía dưới khi mở dialog / drawer / xem ảnh lớn / menu điện thoại (docs/pages/common.md#trên-điện-thoại-cảm-ứng).
// antd khóa bằng <style rc-util-key="rc-util-locker-…"> chỉ đặt body overflow hidden — iPhone vẫn vuốt cuộn được trang dưới.
// Có khóa của antd (hoặc menu điện thoại gọi lockPage) thì gắn class html.scroll-locked: khóa cả html (styles/touch.css)
let manual = 0;
const sync = () => document.documentElement.classList.toggle("scroll-locked", manual > 0 || !!document.querySelector('style[rc-util-key^="rc-util-locker-"]'));

export function initScrollLock() {
  new MutationObserver(sync).observe(document.head, { childList: true });
  sync();
}

// Khóa tay (vd menu điện thoại); trả về hàm mở khóa
export function lockPage() {
  manual += 1;
  sync();
  return () => {
    manual -= 1;
    sync();
  };
}
