import { BuildOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Flex, Radio, Typography } from "antd";
import type { CSSProperties, ReactNode } from "react";
import { radius } from "@/theme";

type Source = "bought" | "made";

const sources: { value: Source; icon: ReactNode; title: string; hint: string }[] = [
  { value: "bought", icon: <ShoppingOutlined />, title: "Nguyên liệu", hint: "Mua về từ nhà cung cấp" },
  { value: "made", icon: <BuildOutlined />, title: "Sản xuất", hint: "Xưởng tự làm, trừ kho theo công thức" },
];

// Chọn Nguồn (drawer nguyên liệu): hai thẻ — ô icon, tên, mô tả, nút tròn bên phải; thẻ đang chọn viền + nền nhạt màu chính (styles/forms.css).
// value / onChange do Form.Item gắn vào
export function SourceChoice({ value, onChange }: { value?: Source; onChange?: (v: Source) => void }) {
  return (
    <Radio.Group className="source-cards" value={value} onChange={(e) => onChange?.(e.target.value)}>
      {sources.map((s) => (
        <Radio key={s.value} value={s.value} className="source-card">
          <span className="source-card-icon" aria-hidden>
            {s.icon}
          </span>
          <span className="source-card-text">
            <span className="source-card-title">{s.title}</span>
            <span className="source-card-hint">{s.hint}</span>
          </span>
        </Radio>
      ))}
    </Radio.Group>
  );
}

// Khối con nền xám trong form: gom các ô của lần nhập / mẻ làm đầu tiên, cùng kiểu khối Ghi phiếu kho
export function SubPanel({ title, description, style, children }: { title: string; description: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <Flex vertical gap={12} role="group" aria-label={title} className="sub-panel" style={{ background: "#f6f6f3", borderRadius: radius.inner, padding: 16, ...style }}>
      <Flex vertical gap={2}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {description}
        </Typography.Text>
      </Flex>
      {children}
    </Flex>
  );
}
