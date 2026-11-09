import { forwardRef, useState, type KeyboardEvent } from "react";
import { PIN_LENGTH } from "@/lib/auth";

type Props = {
  value: string;
  onChange: (pin: string) => void;
  onEnter: () => void;
  error: boolean;
  // Rung nhẹ khi PIN sai (đổi key để chạy lại)
  shakeKey: number;
  disabled: boolean;
  // Đang kiểm tra: không sửa được nhưng giữ focus
  readOnly?: boolean;
  describedBy?: string;
};

// Ô PIN: 6 ô hiển thị chấm, một input thật phủ lên trên. Gõ, dán (bỏ ký tự không phải số) hoặc để trình quản lý mật khẩu điền
// đều được — WCAG 2.2 Accessible Authentication. Điện thoại bật bàn phím số của hệ thống
export const PinField = forwardRef<HTMLInputElement, Props>(function PinField({ value, onChange, onEnter, error, shakeKey, disabled, readOnly, describedBy }, ref) {
  const [focused, setFocused] = useState(false);
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onEnter();
  };
  const cls = ["pin-field", focused && "focused", error && "error", disabled && "disabled"].filter(Boolean).join(" ");
  return (
    <div className={cls}>
      <div key={shakeKey} className={`pin-cells${shakeKey > 0 ? " shake" : ""}`} aria-hidden>
        {Array.from({ length: PIN_LENGTH }, (_, i) => (
          <div key={i} className={`pin-cell${value[i] ? " filled" : ""}${i === Math.min(value.length, PIN_LENGTH - 1) ? " active" : ""}`}>
            {value[i] && <span className="pin-dot" />}
          </div>
        ))}
      </div>
      <input
        ref={ref}
        id="pin"
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        pattern="[0-9]*"
        // Trang chỉ có một ô cần nhập nên focus sẵn
        autoFocus
        aria-label={`Mã PIN ${PIN_LENGTH} số`}
        aria-invalid={error || undefined}
        aria-describedby={describedBy}
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, PIN_LENGTH))}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </div>
  );
});
