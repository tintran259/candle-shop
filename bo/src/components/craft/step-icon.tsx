import {
  BgColorsOutlined,
  BlockOutlined,
  CoffeeOutlined,
  EditOutlined,
  ExperimentOutlined,
  FireOutlined,
  GiftOutlined,
  InboxOutlined,
  StarOutlined,
  TagOutlined,
} from "@ant-design/icons";
import { Segmented, Tooltip } from "antd";
import type { ReactNode } from "react";
import { stepIcons, type StepIcon } from "@/lib/craft/types";

// Ánh xạ tên icon trong cấu hình → icon antd (web dùng bộ icon riêng, xem docs/craft-builder.md)
const icons: Record<StepIcon, { node: ReactNode; label: string }> = {
  vessel: { node: <CoffeeOutlined />, label: "Hũ" },
  layers: { node: <BlockOutlined />, label: "Lớp sáp" },
  flower: { node: <ExperimentOutlined />, label: "Hương" },
  flame: { node: <FireOutlined />, label: "Lửa" },
  palette: { node: <BgColorsOutlined />, label: "Màu" },
  sparkles: { node: <StarOutlined />, label: "Trang trí" },
  pen: { node: <EditOutlined />, label: "Viết" },
  gift: { node: <GiftOutlined />, label: "Quà" },
  tag: { node: <TagOutlined />, label: "Nhãn" },
  box: { node: <InboxOutlined />, label: "Hộp" },
};

export function StepIconView({ icon }: { icon: StepIcon }) {
  return <>{icons[icon]?.node ?? icons.box.node}</>;
}

// Chọn icon cho bước — mỗi ô có tooltip tên để không chỉ dựa vào hình
export function IconPicker({ value, onChange }: { value?: StepIcon; onChange?: (v: StepIcon) => void }) {
  return (
    <Segmented<StepIcon>
      value={value}
      onChange={onChange}
      aria-label="Icon của bước"
      options={stepIcons.map((key) => ({
        value: key,
        label: (
          <Tooltip title={icons[key].label}>
            <span aria-label={icons[key].label} style={{ fontSize: 16, padding: "0 2px" }}>
              {icons[key].node}
            </span>
          </Tooltip>
        ),
      }))}
      style={{ maxWidth: "100%", overflowX: "auto" }}
    />
  );
}
