import { Flex, Form, Switch, Typography } from "antd";
import type { ReactNode } from "react";
import { radius } from "@/theme";

// Một khối trắng bo tròn trong drawer — mỗi khối gom một nhóm trường liên quan
export function FormSection({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section style={{ background: "#fff", borderRadius: radius.card, padding: 20 }} aria-label={title}>
      <Typography.Title level={5} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      {description && (
        <Typography.Text type="secondary" style={{ fontSize: 13 }}>
          {description}
        </Typography.Text>
      )}
      <div style={{ marginTop: 16 }}>{children}</div>
    </section>
  );
}

// Hàng công tắc: nhãn + mô tả bên trái, switch bên phải — cả hàng bấm được
export function SwitchField({ name, label, description, last }: { name: string; label: string; description?: string; last?: boolean }) {
  const id = `switch-${name}`;
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
        padding: "10px 0",
        borderBottom: last ? undefined : "1px solid #f1f1f1",
      }}
    >
      <Flex vertical>
        <Typography.Text strong>{label}</Typography.Text>
        {description && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {description}
          </Typography.Text>
        )}
      </Flex>
      <Form.Item name={name} valuePropName="checked" noStyle>
        <Switch id={id} />
      </Form.Item>
    </label>
  );
}
