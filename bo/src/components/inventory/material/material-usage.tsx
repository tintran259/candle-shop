import { RightOutlined } from "@ant-design/icons";
import { Alert, Empty, Flex, Tag, Typography } from "antd";
import { Link } from "react-router";
import { FormSection } from "@/components/form/form-section";
import { MovementList } from "@/components/inventory/movement-list";
import type { Usage } from "@/lib/inventory/stock";
import type { Material, StockMovement } from "@/lib/inventory/types";

type Props = { usage: Usage[]; unsaved: Usage[]; history: StockMovement[]; materials: Material[] };

const Row = ({ u, draft }: { u: Usage; draft?: boolean }) => (
  <Link to={`/craft?step=${u.target.stepId}${u.target.optionId ? `&edit=${u.target.optionId}` : ""}`} className="list-row-button" style={{ color: "inherit" }}>
    <Flex vertical style={{ flex: 1, minWidth: 0 }}>
      <Typography.Text strong>
        {u.label}
        {draft && (
          <Tag color="gold" style={{ marginInlineStart: 8 }}>
            Chưa lưu
          </Tag>
        )}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Bước {u.step.title.vi}
        {!u.step.enabled && " · đang ẩn"}
      </Typography.Text>
    </Flex>
    <RightOutlined aria-hidden style={{ fontSize: 11, color: "#6b6b6b" }} />
  </Link>
);

// Nguyên liệu đã có: các lựa chọn Thủ công đang dùng (bản đã lưu = web), lựa chọn đã gắn trong bản nháp chưa lưu, 20 phiếu kho gần nhất
export function MaterialUsage({ usage, unsaved, history, materials }: Props) {
  return (
    <>
      <FormSection title={`Dùng trên web (${usage.length})`} description="Các lựa chọn trên trang Thủ công trừ kho bằng nguyên liệu này.">
        <Flex vertical gap={8}>
          {usage.length > 0 && (
            <Flex vertical gap={4}>
              {usage.map((u, i) => (
                <Row key={i} u={u} />
              ))}
            </Flex>
          )}
          {unsaved.length > 0 && (
            <>
              <Alert
                type="warning"
                showIcon
                title={`Đã gắn ${unsaved.length} lựa chọn trong bản nháp Thủ công nhưng chưa lưu`}
                description={
                  <>
                    Bấm <Link to="/craft">Lưu thay đổi ở trang Thủ công</Link> để lên web và trừ kho khi khách đặt.
                  </>
                }
              />
              <Flex vertical gap={4}>
                {unsaved.map((u, i) => (
                  <Row key={i} u={u} draft />
                ))}
              </Flex>
            </>
          )}
          {!usage.length && !unsaved.length && <Typography.Text type="secondary">Chưa gắn với lựa chọn nào — gắn trong drawer sửa lựa chọn ở trang Thủ công.</Typography.Text>}
        </Flex>
      </FormSection>

      <FormSection title="Lịch sử kho" description="20 phiếu gần nhất.">
        {history.length ? <MovementList items={history} materials={materials} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phiếu nào." />}
      </FormSection>
    </>
  );
}
