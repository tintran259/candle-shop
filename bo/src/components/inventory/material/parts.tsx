import { Flex, Typography } from "antd";
import type { CSSProperties, ReactNode } from "react";
import { radius } from "@/theme";

// Một lựa chọn Nguồn: icon, tên, một dòng mô tả
export function SourceOption({ icon, title, hint }: { icon: ReactNode; title: string; hint: string }) {
  return (
    <Flex align="center" gap={10} style={{ padding: "8px 4px", textAlign: "left" }}>
      <span aria-hidden style={{ fontSize: 18, display: "flex" }}>
        {icon}
      </span>
      <Flex vertical style={{ minWidth: 0, lineHeight: 1.35 }}>
        <Typography.Text strong>{title}</Typography.Text>
        <Typography.Text type="secondary" style={{ fontSize: 12, whiteSpace: "normal" }}>
          {hint}
        </Typography.Text>
      </Flex>
    </Flex>
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
