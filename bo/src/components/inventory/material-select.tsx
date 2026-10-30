import { Flex, Select, Tag, Typography } from "antd";
import type { CSSProperties } from "react";
import { NEW_MATERIAL, NO_MATERIAL } from "@/components/craft/option-form";
import { unitLabel } from "@/lib/craft/groups";
import { formatNumber } from "@/lib/format";
import { fold } from "@/lib/search";
import { categoryLabels, levelMeta, materialLevel } from "@/lib/inventory/stock";
import { materialCategories, type Material } from "@/lib/inventory/types";

type Props = {
  value?: string;
  onChange?: (v: string) => void;
  materials: Material[];
  // Cho phép chọn "Tạo nguyên liệu mới trong Kho"
  allowCreate?: boolean;
  // Có mục "Không theo dõi tồn kho" (mặc định có). Ghi phiếu kho thì tắt
  allowNone?: boolean;
  id?: string;
  ariaLabel?: string;
  style?: CSSProperties;
};

// Chọn nguyên liệu trong Kho, gom theo loại, hiện luôn số tồn để admin chọn đúng
export function MaterialSelect({ value, onChange, materials, allowCreate, allowNone = true, id, ariaLabel, style }: Props) {
  const label = (m: Material) => {
    const level = materialLevel(m);
    return (
      <Flex justify="space-between" gap={8} align="center">
        <Typography.Text ellipsis>{m.name}</Typography.Text>
        <Flex gap={6} align="center" style={{ flexShrink: 0 }}>
          {m.tracked && (
            <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
              {formatNumber(m.stock)} {unitLabel[m.unit]}
            </Typography.Text>
          )}
          {m.draft && (
            <Tag color="orange" style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: "18px" }}>
              Chờ lưu
            </Tag>
          )}
          {level !== "ok" && (
            <Tag color={levelMeta[level].color} style={{ marginInlineEnd: 0, fontSize: 11, lineHeight: "18px" }}>
              {levelMeta[level].label}
            </Tag>
          )}
        </Flex>
      </Flex>
    );
  };

  return (
    <Select<string>
      id={id}
      aria-label={ariaLabel}
      style={style}
      showSearch
      value={value}
      onChange={onChange}
      // Tìm không phân biệt dấu: "sap dau" hay "sáp đậu" đều ra "Sáp đậu nành"
      filterOption={(input, option) => fold((option as { search?: string } | undefined)?.search ?? "").includes(fold(input.trim()))}
      options={[
        ...(allowCreate || allowNone
          ? [
              {
                label: "Chung",
                options: [
                  ...(allowCreate ? [{ value: NEW_MATERIAL, search: "Tạo nguyên liệu mới", label: <Typography.Text strong>+ Tạo nguyên liệu mới trong Kho</Typography.Text> }] : []),
                  ...(allowNone ? [{ value: NO_MATERIAL, search: "Không theo dõi tồn kho", label: <Typography.Text type="secondary">Không theo dõi tồn kho</Typography.Text> }] : []),
                ],
              },
            ]
          : []),
        ...materialCategories
          .map((c) => ({
            label: categoryLabels[c],
            options: materials.filter((m) => m.category === c).map((m) => ({ value: m.id, search: `${m.name} ${m.sku ?? ""} ${m.id}`, label: label(m) })),
          }))
          .filter((g) => g.options.length),
      ]}
    />
  );
}
