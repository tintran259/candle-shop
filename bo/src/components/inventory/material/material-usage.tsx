import { RightOutlined } from "@ant-design/icons";
import { Empty, Flex, Typography } from "antd";
import { Link } from "react-router";
import { FormSection } from "@/components/form/form-section";
import { MovementList } from "@/components/inventory/movement-list";
import type { Usage } from "@/lib/inventory/stock";
import type { Material, StockMovement } from "@/lib/inventory/types";

type Props = { usage: Usage[]; history: StockMovement[]; materials: Material[] };

// Nguyên liệu đã có: các lựa chọn Thủ công đang dùng và 20 phiếu kho gần nhất
export function MaterialUsage({ usage, history, materials }: Props) {
  return (
    <>
      <FormSection title={`Dùng trên web (${usage.length})`} description="Các lựa chọn trên trang Thủ công trừ kho bằng nguyên liệu này.">
        {usage.length ? (
          <Flex vertical gap={4}>
            {usage.map((u, i) => (
              <Link key={i} to={`/craft?step=${u.target.stepId}${u.target.optionId ? `&edit=${u.target.optionId}` : ""}`} className="list-row-button" style={{ color: "inherit" }}>
                <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                  <Typography.Text strong>{u.label}</Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    Bước {u.step.title.vi}
                    {!u.step.enabled && " · đang ẩn"}
                  </Typography.Text>
                </Flex>
                <RightOutlined aria-hidden style={{ fontSize: 11, color: "#6b6b6b" }} />
              </Link>
            ))}
          </Flex>
        ) : (
          <Typography.Text type="secondary">Chưa gắn với lựa chọn nào — gắn trong drawer sửa lựa chọn ở trang Thủ công.</Typography.Text>
        )}
      </FormSection>

      <FormSection title="Lịch sử kho" description="20 phiếu gần nhất.">
        {history.length ? <MovementList items={history} materials={materials} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phiếu nào." />}
      </FormSection>
    </>
  );
}
