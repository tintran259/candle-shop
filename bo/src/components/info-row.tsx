import { Flex, Typography } from "antd";
import type { ReactNode } from "react";

// Dòng thông tin: icon nhỏ + nhãn xám + nội dung (dùng trong drawer đơn hàng, khách hàng)
export function InfoRow({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <Flex gap={12} align="flex-start">
      <span aria-hidden style={{ color: "#6b6b6b", marginTop: 2 }}>
        {icon}
      </span>
      <Flex vertical style={{ minWidth: 0, flex: 1 }}>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {label}
        </Typography.Text>
        {children}
      </Flex>
    </Flex>
  );
}
