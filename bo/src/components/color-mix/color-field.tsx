import { CameraOutlined } from "@ant-design/icons";
import { Button, ColorPicker, Input, Space, Tooltip } from "antd";
import { useState } from "react";
import { normHex } from "@/lib/color-mix/color";
import { ImagePicker } from "./image-picker";

// Màn cảm ứng: chạm lần đầu chỉ mở tooltip, phải chạm lần hai mới bấm được nút → chỉ dùng tooltip khi có chuột (rê được)
const CAN_HOVER = typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// Ô nhập màu: bảng chọn màu + mã hex + lấy màu từ ảnh chụp. Trống được (vd mẫu kiểm chứng chưa đo) khi allowEmpty.
// whiteRef: màu mẫu trắng đã lưu — hộp lấy màu từ ảnh cho hiệu chỉnh theo mẫu trắng chụp cùng ảnh (ô của chính mẫu trắng thì không truyền)
export function ColorField({ value, onChange, allowEmpty, label, whiteRef }: { value: string; onChange: (hex: string) => void; allowEmpty?: boolean; label: string; whiteRef?: string }) {
  const [text, setText] = useState(value);
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);
  const hex = normHex(value);

  const commit = () => {
    setEditing(false);
    const t = text.trim();
    if (!t && allowEmpty) return onChange("");
    const h = normHex(t);
    if (h) onChange(h);
    else setText(value);
  };
  const camera = <Button icon={<CameraOutlined />} aria-label={`${label}: lấy màu từ ảnh`} onClick={() => setPicking(true)} />;

  return (
    <Space.Compact>
      <ColorPicker value={hex ?? "#FFFFFF"} disabledAlpha aria-label={label} onChangeComplete={(c) => onChange(c.toHexString().toUpperCase())} />
      <Input
        aria-label={`${label} (mã hex)`}
        className="color-mix-hex"
        placeholder="#RRGGBB"
        value={editing ? text : value}
        onFocus={() => {
          setText(value);
          setEditing(true);
        }}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onPressEnter={commit}
      />
      {CAN_HOVER ? <Tooltip title="Lấy màu từ ảnh">{camera}</Tooltip> : camera}
      <ImagePicker open={picking} onClose={() => setPicking(false)} onPick={onChange} whiteRef={whiteRef} />
    </Space.Compact>
  );
}
