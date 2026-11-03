import { EyeInvisibleOutlined, PlusOutlined, WarningFilled } from "@ant-design/icons";
import { Button, Card, Flex, Tooltip, Typography } from "antd";
import { StepIconView } from "@/components/craft/step-icon";
import { DragHandle, SortableHandle, SortableList } from "@/components/sortable";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { useSortableItem } from "@/hooks/use-sortable-item";
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

// Danh sách bước theo đúng thứ tự khách thấy trên web; kéo tay nắm để đổi thứ tự
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
        <SortableList ids={steps.map((s) => s.id)} name={(id) => steps.find((s) => s.id === id)?.title.vi ?? ""} onMove={api.moveStep}>
          {steps.map((s, i) => (
            <StepRow key={s.id} step={s} index={i} selected={s.id === active} issue={withIssues.has(s.id)} changed={!!changed?.has(s.id)} onSelect={onSelect} />
          ))}
        </SortableList>
      </Flex>
    </Card>
  );
}

type RowProps = { step: CraftStep; index: number; selected: boolean; issue: boolean; changed: boolean; onSelect: (id: string) => void };

// Một bước: tay nắm kéo bên trái, bấm phần còn lại để mở bước
function StepRow({ step: s, index: i, selected, issue, changed, onSelect }: RowProps) {
  const { setNodeRef, style, handle } = useSortableItem(s.id, {
    borderRadius: radius.inner,
    padding: "6px 6px 6px 2px",
    background: selected ? brand.emberLight : undefined,
    boxShadow: selected ? `inset 3px 0 0 ${brand.ember}` : undefined,
  });
  return (
    <SortableHandle value={handle}>
      <Flex ref={setNodeRef} role="listitem" align="center" gap={4} style={style}>
        <DragHandle name={s.title.vi} />
        <button type="button" className="step-row" aria-current={selected ? "true" : undefined} onClick={() => onSelect(s.id)}>
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
              {changed && (
                <Tooltip title="Có thay đổi chưa lưu">
                  <span className="save-bar-dot" aria-label="Có thay đổi chưa lưu" role="img" style={{ width: 8, height: 8 }} />
                </Tooltip>
              )}
              {issue && <WarningFilled aria-label="Cần xem lại" style={{ color: "#d4380d", fontSize: 12 }} />}
            </Flex>
            <Typography.Text type="secondary" ellipsis style={{ fontSize: 12 }}>
              {/* Bước ô nhập: chỉ ghi số lượng — tên component dài làm dòng bị cắt */}
              {s.kind === "inputs" ? count(s) : `${kindMeta[s.kind].label} · ${count(s)}`}
            </Typography.Text>
          </Flex>
        </button>
      </Flex>
    </SortableHandle>
  );
}
