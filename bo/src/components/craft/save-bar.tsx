import { RightOutlined, UndoOutlined } from "@ant-design/icons";
import { Button, Drawer, Flex, Grid, Popconfirm, Tag, Typography } from "antd";
import { StepIconView } from "@/components/craft/step-icon";
import type { ChangeKind, StepChange } from "@/lib/craft/changes";
import { unitLabel } from "@/lib/craft/groups";
import { formatNumber } from "@/lib/format";
import { categoryLabels } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { brand } from "@/theme";

type Props = {
  changes: StepChange[];
  reordered: boolean;
  // Nguyên liệu tạo từ trang này, vào Kho khi Lưu
  newMaterials: Material[];
  errors: number;
  warnings: number;
  onSave: () => void;
  onDiscard: () => void;
  onDetails: () => void;
};

const total = (changes: StepChange[]) => changes.reduce((n, c) => n + c.items.length, 0);

// Thanh dính đáy khi bản nháp khác bản đang lên web: tóm tắt số thay đổi + mở danh sách chi tiết
export function SaveBar({ changes, reordered, newMaterials, errors, warnings, onSave, onDiscard, onDetails }: Props) {
  const count = total(changes) + (reordered ? 1 : 0);
  const steps = changes.map((c) => c.step.title.vi);
  return (
    <div className="save-bar" role="region" aria-label="Thay đổi chưa lưu">
      <Flex align="center" gap={12} style={{ flex: "1 1 280px", minWidth: 0 }}>
        <span className="save-bar-dot" aria-hidden />
        <Flex vertical style={{ minWidth: 0, flex: 1 }}>
          <Typography.Text strong>
            {count} thay đổi chưa lưu{steps.length ? ` ở ${steps.length} bước` : ""} — web vẫn đang dùng bản cũ
          </Typography.Text>
          <Typography.Text type="secondary" ellipsis style={{ fontSize: 13 }}>
            {[...steps, reordered && "Thứ tự bước", newMaterials.length && `${newMaterials.length} nguyên liệu mới vào Kho khi Lưu`].filter(Boolean).join(" · ")}
          </Typography.Text>
        </Flex>
        {errors > 0 ? (
          <Tag color="error" style={{ marginInlineEnd: 0 }}>
            {errors} lỗi
          </Tag>
        ) : warnings > 0 ? (
          <Tag color="warning" style={{ marginInlineEnd: 0 }}>
            {warnings} cảnh báo
          </Tag>
        ) : null}
      </Flex>
      <Flex gap={8} wrap style={{ flexShrink: 0 }}>
        <Button onClick={onDetails}>Xem thay đổi</Button>
        <Popconfirm title="Bỏ mọi thay đổi chưa lưu?" description="Cấu hình quay về bản web đang dùng." okText="Bỏ thay đổi" okButtonProps={{ danger: true }} cancelText="Tiếp tục sửa" onConfirm={onDiscard}>
          <Button>Bỏ thay đổi</Button>
        </Popconfirm>
        <Button type="primary" onClick={onSave}>
          Lưu thay đổi
        </Button>
      </Flex>
    </div>
  );
}

const kindTag: Record<ChangeKind, { label: string; color: string }> = {
  added: { label: "Thêm", color: "success" },
  edited: { label: "Sửa", color: "processing" },
  removed: { label: "Xóa", color: "error" },
};

type DrawerProps = {
  open: boolean;
  changes: StepChange[];
  reordered: boolean;
  newMaterials: Material[];
  onClose: () => void;
  // Mở đúng chỗ đã sửa (bước, tab, lựa chọn)
  onOpen: (stepId: string, target: { view?: string; optionId?: string }) => void;
  onRevert: (stepId: string) => void;
  onSave: () => void;
};

// Danh sách mọi thay đổi chưa lưu, nhóm theo bước: cũ → mới, bấm để mở, hoàn tác từng bước
export function ChangesDrawer({ open, changes, reordered, newMaterials, onClose, onOpen, onRevert, onSave }: DrawerProps) {
  const screens = Grid.useBreakpoint();
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Thay đổi chưa lưu (${total(changes) + (reordered ? 1 : 0)})`}
      size={screens.sm === false ? "100%" : 520}
      styles={{ body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex justify="flex-end" gap={8}>
          <Button onClick={onClose}>Sửa tiếp</Button>
          <Button type="primary" onClick={onSave} disabled={!changes.length && !reordered}>
            Lưu tất cả
          </Button>
        </Flex>
      }
    >
      <Flex vertical gap={12}>
        {reordered && (
          <div className="change-group">
            <Typography.Text strong>Thứ tự các bước</Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 13 }}>
              Đã đổi thứ tự bước trên web.
            </Typography.Text>
          </div>
        )}
        {changes.map((c) => (
          <section key={c.step.id} className="change-group" aria-label={`Thay đổi ở bước ${c.step.title.vi}`}>
            <Flex align="center" gap={10}>
              <span aria-hidden style={{ color: brand.emberDark, fontSize: 16 }}>
                <StepIconView icon={c.step.icon} />
              </span>
              <Typography.Text strong ellipsis style={{ flex: 1, minWidth: 0 }}>
                {c.step.title.vi}
              </Typography.Text>
              <Tag color={kindTag[c.kind].color} style={{ marginInlineEnd: 0 }}>
                {kindTag[c.kind].label} bước
              </Tag>
              <Popconfirm
                title={`Hoàn tác bước “${c.step.title.vi}”?`}
                description={c.kind === "added" ? "Bỏ bước mới thêm này." : c.kind === "removed" ? "Khôi phục bước đã xóa." : "Mọi thay đổi trong bước quay về bản đã lưu."}
                okText="Hoàn tác"
                cancelText="Hủy"
                onConfirm={() => onRevert(c.step.id)}
              >
                <Button size="small" type="text" icon={<UndoOutlined />} aria-label={`Hoàn tác ${c.step.title.vi}`}>
                  Hoàn tác
                </Button>
              </Popconfirm>
            </Flex>
            <Flex vertical style={{ marginTop: 8 }} role="list">
              {c.items.map((item, i) => {
                const canOpen = c.kind !== "removed" && item.kind !== "removed";
                const body = (
                  <>
                    <span className={`change-dot change-${item.kind}`} aria-hidden />
                    <Flex vertical style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      {/* Nhiều trường của cùng một mục: chỉ ghi tên mục ở dòng đầu */}
                      {item.subject && item.subject !== c.items[i - 1]?.subject && (
                        <Typography.Text strong style={{ fontSize: 13 }}>
                          {item.subject}
                        </Typography.Text>
                      )}
                      <Typography.Text style={{ fontSize: 13, overflowWrap: "anywhere" }} delete={item.kind === "removed" && !!item.subject}>
                        {item.text}
                      </Typography.Text>
                    </Flex>
                    {canOpen && <RightOutlined aria-hidden style={{ fontSize: 11, color: "#6b6b6b" }} />}
                  </>
                );
                return canOpen ? (
                  <button key={i} type="button" role="listitem" className="change-row" onClick={() => onOpen(c.step.id, { view: item.view, optionId: item.optionId })}>
                    {body}
                  </button>
                ) : (
                  <div key={i} role="listitem" className="change-row" style={{ cursor: "default" }}>
                    {body}
                  </div>
                );
              })}
            </Flex>
          </section>
        ))}
        {newMaterials.length > 0 && (
          <section className="change-group" aria-label="Nguyên liệu mới">
            <Typography.Text strong>Nguyên liệu mới trong Kho ({newMaterials.length})</Typography.Text>
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 13 }}>
              Tạo từ các lựa chọn ở trên — chỉ vào Kho khi bấm Lưu, kèm phiếu “Tồn ban đầu”. Bỏ thay đổi thì không tạo.
            </Typography.Text>
            <Flex vertical style={{ marginTop: 8 }} role="list">
              {newMaterials.map((m) => (
                <div key={m.id} role="listitem" className="change-row" style={{ cursor: "default" }}>
                  <span className="change-dot change-added" aria-hidden />
                  <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                    <Typography.Text strong style={{ fontSize: 13 }}>
                      {m.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {categoryLabels[m.category]} · tồn ban đầu {formatNumber(m.stock)} {unitLabel[m.unit]}
                    </Typography.Text>
                  </Flex>
                </div>
              ))}
            </Flex>
          </section>
        )}
        {!changes.length && !reordered && <Typography.Text type="secondary">Không còn thay đổi nào.</Typography.Text>}
      </Flex>
    </Drawer>
  );
}
