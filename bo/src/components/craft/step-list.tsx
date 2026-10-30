import { ArrowDownOutlined, ArrowUpOutlined, EyeInvisibleOutlined, PlusOutlined, WarningFilled } from "@ant-design/icons";
import { Button, Card, Flex, Tag, Tooltip, Typography } from "antd";
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
  api: CraftConfigApi;
  onSelect: (id: string) => void;
  onAdd: () => void;
};

const count = (s: CraftStep) =>
  s.kind === "inputs" ? `${s.fields.filter((f) => f.enabled).length} ô nhập · ${s.addons.filter((a) => a.enabled).length} tuỳ chọn` : `${s.options.length} lựa chọn`;

// Danh sách bước theo đúng thứ tự khách thấy trên web; đổi thứ tự bằng nút lên/xuống
export function StepList({ steps, active, withIssues, api, onSelect, onAdd }: Props) {
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
                    {withIssues.has(s.id) && <WarningFilled aria-label="Cần xem lại" style={{ color: "#d4380d", fontSize: 12 }} />}
                  </Flex>
                  <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
                    {kindMeta[s.kind].label} · {count(s)}
                  </Typography.Text>
                </Flex>
                {!s.enabled && (
                  <Tag icon={<EyeInvisibleOutlined />} style={{ marginInlineEnd: 0 }}>
                    Ẩn
                  </Tag>
                )}
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
