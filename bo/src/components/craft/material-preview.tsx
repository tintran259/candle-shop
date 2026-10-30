import { Avatar, Flex, Form, Tag, Typography } from "antd";
import { NEW_MATERIAL, type OptionFormValues } from "@/components/craft/option-form";
import type { SizeOption } from "@/lib/craft/types";
import { formatDelta, unitLabel } from "@/lib/craft/groups";
import { formatNumber } from "@/lib/format";
import { levelMeta, materialLevel, type StockLevel } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { brand, radius } from "@/theme";

// Thẻ xem trước đầu drawer — cập nhật theo từng thay đổi trong form; tồn kho lấy từ nguyên liệu đang gắn.
// sizes = bước hũ: tồn kho tính theo từng cỡ (mã hũ riêng mỗi dung tích)
export function MaterialPreview({ materials, groupLabel, sizes }: { materials: Material[]; groupLabel: string; sizes?: SizeOption[] }) {
  const form = Form.useFormInstance<OptionFormValues>();
  const v = Form.useWatch([], { form, preserve: true }) as OptionFormValues | undefined;
  if (!v) return null;

  const image = v.images?.[0];
  // Mức tồn của một ô chọn nguyên liệu (id có sẵn / tạo mới kèm tồn ban đầu / không theo dõi)
  const levelFor = (id: string | undefined, newStock?: number): StockLevel => {
    if (id === NEW_MATERIAL) return (newStock ?? 0) > 0 ? "ok" : "out";
    const m = materials.find((x) => x.id === id);
    return m ? materialLevel(m) : "untracked";
  };

  let level: StockLevel;
  let figure: { label: string; value: string; unit?: string };
  if (sizes) {
    // Hũ: đếm số cỡ còn hàng trên các cỡ đổ được
    const supported = sizes.filter((s) => v.supportedSizeIds?.includes(s.id));
    const levels = supported.map((s) => levelFor(v.sizeStock?.[s.id]?.jar, v.sizeStock?.[s.id]?.jarStock));
    const inStock = levels.filter((l) => l !== "out").length;
    level = levels.every((l) => l === "untracked") ? "untracked" : levels.every((l) => l === "out") ? "out" : levels.some((l) => l === "out" || l === "low") ? "low" : "ok";
    figure = { label: "Cỡ còn hàng", value: `${inStock}/${supported.length}` };
  } else {
    const linked = materials.find((m) => m.id === v.materialId);
    const isNew = v.materialId === NEW_MATERIAL;
    level = levelFor(v.materialId, v.newStock);
    figure = {
      label: linked ? `Tồn kho · ${linked.name}` : isNew ? "Tồn ban đầu (tạo mới)" : "Tồn kho",
      value: linked ? (linked.tracked ? formatNumber(linked.stock) : "∞") : isNew ? formatNumber(v.newStock ?? 0) : "∞",
      unit: linked ? (linked.tracked ? unitLabel[linked.unit] : undefined) : isNew ? unitLabel[v.newUnit ?? "pcs"] : undefined,
    };
  }

  return (
    <section aria-label="Xem trước" style={{ background: "#fff", borderRadius: radius.card, padding: 20 }}>
      <Flex gap={16} align="center">
        <Avatar
          shape="square"
          size={72}
          src={image}
          alt=""
          style={{
            borderRadius: 16,
            flexShrink: 0,
            background: image ? undefined : v.hasSwatch && v.swatch ? v.swatch : brand.emberLight,
            border: "1px solid #f1f1f1",
          }}
        />
        <Flex vertical style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {groupLabel}
          </Typography.Text>
          <Typography.Title level={4} ellipsis style={{ margin: 0 }}>
            {v.nameVi?.trim() || "Lựa chọn mới"}
          </Typography.Title>
          <Flex gap={6} wrap style={{ marginTop: 6 }}>
            <Tag color={v.available ? "success" : "default"}>{v.available ? "Đang bán" : "Tạm ẩn"}</Tag>
            <Tag color={levelMeta[level].color}>{levelMeta[level].label}</Tag>
          </Flex>
        </Flex>
      </Flex>

      <Flex gap={12} style={{ marginTop: 20 }}>
        <Figure label="Phụ thu mỗi hũ" value={v.price ? formatDelta(v.price) : "0 ₫"} />
        <Figure {...figure} />
      </Flex>
    </section>
  );
}

function Figure({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Flex vertical style={{ flex: 1, minWidth: 0, background: "#f6f6f3", borderRadius: 14, padding: "12px 16px" }}>
      <Typography.Text type="secondary" ellipsis style={{ fontSize: 13 }}>
        {label}
      </Typography.Text>
      <span className="big-number" style={{ fontSize: 30, lineHeight: 1.2 }}>
        {value}
        {unit && <span style={{ fontSize: 15, marginLeft: 4, color: "#6b6b6b" }}>{unit}</span>}
      </span>
    </Flex>
  );
}
