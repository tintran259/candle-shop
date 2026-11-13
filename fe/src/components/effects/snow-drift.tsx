// Trang trí Noel cho hero (đi kèm tuyết rơi): lớp tuyết đọng dọc đáy hero — dày ở hai góc, mỏng ở giữa để không che chữ sáng "câu lớn".
// Hai lớp (lớp sau mờ hơn, lệch nhịp) cho cảm giác tuyết dày, mềm. SVG dưới lớp chữ, không chặn bấm, trình đọc màn hình bỏ qua.
// hero-effect.tsx bọc trong .snow-in (globals.css) để hiện dần sau khi hero mở xong. Điện thoại thấp hơn vì câu lớn chiếm gần hết bề ngang.

export function SnowDrift() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 bottom-0 h-[26px] w-full md:h-[44px] xl:h-[56px]">
        <defs>
          <linearGradient id="snow-back" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f5f2e9" stopOpacity="0.35" />
            <stop offset="1" stopColor="#f5f2e9" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="snow-front" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="1" stopColor="#e6dfd0" />
          </linearGradient>
        </defs>
        <path d="M0 4 C60 2 120 14 180 24 S300 40 380 44 S560 44 700 46 S920 44 1060 44 S1220 36 1290 22 S1400 0 1440 2 L1440 60 L0 60 Z" fill="url(#snow-back)" />
        <path d="M0 12 C50 10 110 20 170 32 S290 48 380 50 S560 48 720 51 S920 48 1080 50 S1230 42 1300 30 S1400 8 1440 10 L1440 60 L0 60 Z" fill="url(#snow-front)" />
      </svg>
    </div>
  );
}
