import { ArrowDownOutlined, ArrowUpOutlined, EyeInvisibleOutlined, PlusOutlined, WarningFilled } from "@ant-design/icons";
import { Button, Card, Flex, Tooltip, Typography } from "antd";
import { StepIconView } from "@/components/craft/step-icon";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { kindMeta } from "@/lib/craft/steps";
import type { CraftStep } from "@/lib/craft/types";
import { brand, radius } from "@/theme";

type Props = {
  steps: CraftStep[];
  active?: string;
  // Bước có lỗi cấu hình (chấm đỏ) — không chỉ báo bằng màu, có thêm icon cảnh báo
  withIssues: Set<string>;
  // Bước có thay đổi chưa lưu
  changed?: Set<string>;
  api: CraftConfigApi;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

const count = (s: CraftStep) =>
  s.kind === "inputs" ? `${s.fields.filter((f) => f.enabled).length} ô nhập · ${s.addons.filter((a) => a.enabled).length} tuỳ chọn` : `${s.options.length} lựa chọn`;

// Danh sách bước theo đúng thứ tự khách thấy trên web; đổi thứ tự bằng nút lên/xuống
export function StepList({ steps, active, withIssues, changed, api, onSelect, onAdd }: Props) {
  return (
    <Card
      title="Các bước"
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>
          Thêm bước
        </Button>
      }
      styles={{ body: { padding: 12 } }}
    >
      {!steps.length && (
        <Typography.Paragraph type="secondary" style={{ margin: 4, fontSize: 13 }}>
          Chưa có bước nào. Bắt đầu bằng bước <strong>Hũ & kích thước</strong> (bắt buộc, quyết định giá gốc), rồi thêm Sáp, Mùi hương…
        </Typography.Paragraph>
      )}
      <Flex vertical gap={6} role="list" aria-label="Các bước">
        {steps.map((s, i) => {
          const selected = s.id === active;
          return (
            <Flex
              key={s.id}
              role="listitem"
              align="center"
              gap={8}
              style={{
                borderRadius: radius.inner,
                padding: "6px 6px 6px 4px",
                background: selected ? brand.emberLight : undefined,
                boxShadow: selected ? `inset 3px 0 0 ${brand.ember}` : undefined,
              }}
            >
              <button
                type="button"
                className="step-row"
                aria-current={selected ? "true" : undefined}
                onClick={() => onSelect(s.id)}
              >
                <span className="step-row-index" style={{ opacity: s.enabled ? 1 : 0.5 }}>
                  {i + 1}
                </span>
                <span aria-hidden style={{ color: s.enabled ? brand.emberDark : "#6b6b6b", fontSize: 16 }}>
                  <StepIconView icon={s.icon} />
                </span>
                <Flex vertical style={{ minWidth: 0, flex: 1, textAlign: "left" }}>
                  <Flex align="center" gap={6}>
                    <Typography.Text strong ellipsis style={{ color: s.enabled ? undefined : "#6b6b6b" }}>
                      {s.title.vi}
                    </Typography.Text>
                    {/* Icon thay cho tag "Ẩn" — tag chiếm chỗ làm dòng mô tả bên dưới bị cắt */}
                    {!s.enabled && (
                      <Tooltip title="Đang ẩn với khách">
                        <EyeInvisibleOutlined aria-label="Đang ẩn" style={{ color: "#6b6b6b", fontSize: 13 }} />
                      </Tooltip>
                    )}
                    {changed?.has(s.id) && (
                      <Tooltip title="Có thay đổi chưa lưu">
                        <span className="save-bar-dot" aria-label="Có thay đổi chưa lưu" role="img" style={{ width: 8, height: 8 }} />
                      </Tooltip>
                    )}
                    {withIssues.has(s.id) && <WarningFilled aria-label="Cần xem lại" style={{ color: "#d4380d", fontSize: 12 }} />}
                  </Flex>
                  <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                    {/* Bước ô nhập: chỉ ghi số lượng — tên component dài làm dòng bị cắt */}
                    {s.kind === "inputs" ? count(s) : `${kindMeta[s.kind].label} · ${count(s)}`}
                  </Typography.Text>
                </Flex>
              </button>
              <Flex vertical>
                <Tooltip title="Lên trên" placement="left">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowUpOutlined />}
                    aria-label={`Đưa ${s.title.vi} lên trên`}
                    disabled={i === 0}
                    onClick={() => api.moveStep(s.id, -1)}
                  />
                </Tooltip>
                <Tooltip title="Xuống dưới" placement="left">
                  <Button
                    type="text"
                    size="small"
                    icon={<ArrowDownOutlined />}
                    aria-label={`Đưa ${s.title.vi} xuống dưới`}
                    disabled={i === steps.length - 1}
                    onClick={() => api.moveStep(s.id, 1)}
                  />
                </Tooltip>
              </Flex>
            </Flex>
          );
        })}
      </Flex>
    </Card>
  );
}
