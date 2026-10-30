import { Avatar, Badge, Flex, Tag, Tooltip, Typography } from "antd";
import { Link } from "react-router";
import { sizeLabel, unitLabel } from "@/lib/craft/groups";
import type { SizeOption, StepOption, VesselOption } from "@/lib/craft/types";
import { formatNumber } from "@/lib/format";
import { levelMeta, materialLevel, vesselSizeLevel, type MaterialMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

// Ảnh chính nếu có, không thì ô màu (hoặc sọc khi không có màu)
export function MaterialAvatar({ item, swatch = true }: { item: Pick<StepOption, "images" | "swatch">; swatch?: boolean }) {
  const count = item.images?.length ?? 0;
  if (count) {
    return (
      <Badge count={count > 1 ? count : 0} size="small" color="#0c0d12" offset={[-2, 34]}>
        <Avatar shape="square" size={40} src={item.images![0]} alt="" />
      </Badge>
    );
  }
  if (!swatch) return null;
  return (
    <Avatar
      shape="square"
      size={40}
      style={{
        background: item.swatch ?? "repeating-linear-gradient(45deg,#efe4dc 0 4px,#fdfbf7 4px 8px)",
        border: "1px solid #f0f0f0",
      }}
    />
  );
}

// Số tồn + nhãn mức tồn của một nguyên liệu
export function MaterialStock({ material }: { material: Material }) {
  const level = materialLevel(material);
  if (level === "untracked") return <Typography.Text type="secondary">Không theo dõi</Typography.Text>;
  return (
    <Flex vertical align="flex-start" gap={4}>
      <Typography.Text strong className="tabular" style={{ whiteSpace: "nowrap" }}>
        {formatNumber(material.stock)} {unitLabel[material.unit]}
      </Typography.Text>
      {level !== "ok" && <Tag color={levelMeta[level].color}>{levelMeta[level].label}</Tag>}
    </Flex>
  );
}

// Nhãn cho nguyên liệu tạo từ trang Thủ công, chưa vào Kho (vào khi bấm Lưu)
export function DraftMaterialTag() {
  return (
    <Tooltip title="Nguyên liệu mới — tạo trong Kho khi bấm “Lưu thay đổi”">
      <Tag color="orange" style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: "18px" }}>
        Chờ lưu
      </Tag>
    </Tooltip>
  );
}

// Tồn kho của hũ theo từng cỡ: mỗi dòng là một mã hũ riêng trong Kho, bấm để mở
export function VesselStock({ option, sizes, map }: { option: VesselOption; sizes: SizeOption[]; map: MaterialMap }) {
  const rows = sizes.filter((s) => option.supportedSizeIds.includes(s.id));
  if (!rows.length) return <Typography.Text type="secondary">Chưa chọn cỡ</Typography.Text>;
  return (
    <Flex vertical gap={4} style={{ minWidth: 150 }}>
      {rows.map((size) => {
        const id = option.sizeMaterials?.[size.id]?.materialId;
        const m = id ? map.get(id) : undefined;
        const level = vesselSizeLevel(option, size.id, map);
        return (
          <Flex key={size.id} gap={8} align="center" style={{ whiteSpace: "nowrap" }}>
            <Typography.Text type="secondary" className="tabular" style={{ width: 48, fontSize: 13 }}>
              {sizeLabel(size)}
            </Typography.Text>
            {m?.draft ? (
              <>
                <Typography.Text className="tabular" style={{ fontSize: 13 }} title={m.name}>
                  {formatNumber(m.stock)} {unitLabel[m.unit]}
                </Typography.Text>
                <DraftMaterialTag />
              </>
            ) : m ? (
              <Link to={`/inventory?material=${m.id}`} className="tabular" style={{ fontSize: 13 }} title={m.name}>
                {m.tracked ? `${formatNumber(m.stock)} ${unitLabel[m.unit]}` : "Không theo dõi"}
              </Link>
            ) : (
              <Typography.Text type={id ? "danger" : "secondary"} style={{ fontSize: 13 }}>
                {id ? "Mã đã xóa" : "Không theo dõi"}
              </Typography.Text>
            )}
            {(level === "out" || level === "low") && (
              <Tag color={levelMeta[level].color} style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: "18px" }}>
                {levelMeta[level].label}
              </Tag>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}

// Tồn kho của một lựa chọn trên trang Thủ công: lấy từ nguyên liệu gắn kèm, bấm để mở trong Kho
export function OptionStock({ materialId, map }: { materialId?: string; map: MaterialMap }) {
  if (!materialId) return <Typography.Text type="secondary">Không theo dõi</Typography.Text>;
  const m = map.get(materialId);
  if (!m) return <Tag color="error">Nguyên liệu đã xóa</Tag>;
  return (
    <Flex vertical gap={2}>
      <MaterialStock material={m} />
      {m.draft ? (
        <Flex gap={6} align="center">
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {m.name}
          </Typography.Text>
          <DraftMaterialTag />
        </Flex>
      ) : (
        <Link to={`/inventory?material=${m.id}`} style={{ fontSize: 12 }}>
          {m.name}
        </Link>
      )}
    </Flex>
  );
}
