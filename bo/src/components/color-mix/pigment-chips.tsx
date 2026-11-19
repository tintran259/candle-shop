import { CheckOutlined } from "@ant-design/icons";
import { Typography } from "antd";
import { pigmentSwatch } from "@/lib/color-mix/model";
import { MODE_LABEL, type Pigment } from "@/lib/color-mix/types";

// Chip bật / tắt các màu được dùng khi tìm công thức (styles/color-mix-chips.css). Kết hợp: chia nhóm Bột oxit / Màu nước
export function PigmentChips({ pigments, off, onToggle, grouped, label }: { pigments: Pigment[]; off: string[]; onToggle: (id: string, on: boolean) => void; grouped?: boolean; label: string }) {
  const chips = (list: Pigment[], aria: string) => (
    <div className="color-mix-chips" role="group" aria-label={aria}>
      {list.map((p) => {
        const on = !off.includes(p.id);
        return (
          <button key={p.id} type="button" className="color-mix-chip" aria-pressed={on} onClick={() => onToggle(p.id, !on)}>
            <span className="color-mix-chip-dot" style={{ background: pigmentSwatch(p) }} />
            <span className="color-mix-chip-name">{p.name}</span>
            <CheckOutlined className="color-mix-chip-check" aria-hidden />
          </button>
        );
      })}
    </div>
  );
  if (!grouped) return chips(pigments, label);
  return (
    <div className="color-mix-chip-groups">
      {(["oxide", "liquid"] as const).map((kind) => {
        const list = pigments.filter((p) => p.kind === kind);
        return (
          list.length > 0 && (
            <div key={kind}>
              <Typography.Text type="secondary" className="color-mix-chip-group-label">
                {MODE_LABEL[kind]}
              </Typography.Text>
              {chips(list, `${label} — ${MODE_LABEL[kind]}`)}
            </div>
          )
        );
      })}
    </div>
  );
}
