import { Button, Tooltip as AntTooltip, type TooltipProps } from "antd";
import { isValidElement, type ReactElement } from "react";

// Máy có chuột (rê được). Điện thoại / máy tính bảng: false
const CAN_HOVER = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Tooltip dùng chung cho BO (thay Tooltip của antd — eslint chặn import trực tiếp).
// Điện thoại: tooltip rê chuột làm iPhone coi lần chạm đầu là "rê" → phải chạm 2 lần mới bấm được nút. Nên trên máy cảm ứng:
// - bọc nút / link (Button, có onClick / href): không hiện tooltip, chạm một lần là bấm (nút icon đã có aria-label).
//   Nút đang khóa (disabled) thì vẫn chạm để xem lý do;
// - bọc chữ, nhãn, biểu tượng thông tin: chạm để xem (trigger click), chạm chỗ khác để tắt.
export function Tooltip(props: TooltipProps) {
  if (CAN_HOVER) return <AntTooltip {...props} />;
  const child = props.children;
  if (isValidElement(child)) {
    const p = (child as ReactElement<Record<string, unknown>>).props;
    if ((child.type === Button || typeof p.onClick === "function" || typeof p.href === "string") && !p.disabled) return child;
  }
  return <AntTooltip {...props} trigger="click" />;
}
