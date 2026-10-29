import { CloseCircleFilled, ExclamationCircleFilled, RightOutlined, WarningOutlined } from "@ant-design/icons";
import { Card, Col, Flex, Row, Typography } from "antd";
import { MaterialAvatar } from "@/components/craft/material-view";
import { LOW_STOCK, optionGroups, unitLabel, type OptionGroup } from "@/lib/craft/groups";
import type { BaseOption } from "@/lib/craft/types";
import { formatNumber } from "@/lib/format";

export type RestockRow = { group: OptionGroup; item: BaseOption };

// Màu trạng thái luôn đi kèm icon + chữ, không chỉ dựa vào màu
const status = {
  out: { label: "Hết hàng", color: "#a8071a", bg: "#fff1f0", bar: "#ff7875", icon: <CloseCircleFilled /> },
  low: { label: "Sắp hết", color: "#ad4e00", bg: "#fff7e6", bar: "#ffc069", icon: <ExclamationCircleFilled /> },
} as const;

// Thẻ "Cần nhập thêm": mỗi nguyên liệu một ô, bấm để mở đúng tab nhóm của nó
export function RestockPanel({ out, low, onOpen }: { out: RestockRow[]; low: RestockRow[]; onOpen: (group: OptionGroup) => void }) {
  // Hết hàng trước, rồi tới mục còn ít nhất so với ngưỡng
  const rows = [
    ...out.map((r) => ({ ...r, level: "out" as const, ratio: 0 })),
    ...low
      .map((r) => ({ ...r, level: "low" as const, ratio: r.item.stock / LOW_STOCK[r.item.unit] }))
      .sort((a, b) => a.ratio - b.ratio),
  ];

  return (
    <Card styles={{ body: { padding: 20 } }}>
      <Flex align="center" gap={12} wrap>
        <span
          aria-hidden
          style={{
            display: "grid",
            placeItems: "center",
            width: 40,
            height: 40,
            borderRadius: 12,
            background: status.low.bg,
            color: status.low.color,
            fontSize: 18,
          }}
        >
          <WarningOutlined />
        </span>
        <Flex vertical style={{ flex: 1, minWidth: 180 }}>
          <Typography.Text strong style={{ fontSize: 17 }}>
            Cần nhập thêm
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {[out.length && `${out.length} hết hàng`, low.length && `${low.length} sắp hết`].filter(Boolean).join(" · ")} — khách không chọn
            được mục hết hàng.
          </Typography.Text>
        </Flex>
      </Flex>

      <Row gutter={[12, 12]} style={{ marginTop: 16 }}>
        {rows.map(({ group, item, level, ratio }) => {
          const s = status[level];
          return (
            <Col key={`${group}-${item.id}`} xs={24} sm={12} lg={8} xxl={6}>
              <button
                type="button"
                onClick={() => onOpen(group)}
                aria-label={`${item.name.vi}: ${s.label}, mở tab ${optionGroups[group].label}`}
                className="restock-tile"
              >
                <Flex align="center" gap={12}>
                  <MaterialAvatar item={item} swatch />
                  <Flex vertical style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <Typography.Text strong ellipsis>
                      {item.name.vi}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                      {optionGroups[group].label}
                    </Typography.Text>
                  </Flex>
                  <RightOutlined className="restock-tile-arrow" style={{ fontSize: 11, color: "#6b6b6b" }} aria-hidden />
                </Flex>

                <Flex justify="space-between" align="center" style={{ marginTop: 12 }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 8px",
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      color: s.color,
                      background: s.bg,
                    }}
                  >
                    {s.icon}
                    {s.label}
                  </span>
                  <Typography.Text strong className="tabular" style={{ fontSize: 13 }}>
                    {formatNumber(item.stock)} {unitLabel[item.unit]}
                    <Typography.Text type="secondary" style={{ fontSize: 12, fontWeight: 400 }}>
                      {" "}
                      / {formatNumber(LOW_STOCK[item.unit])}
                    </Typography.Text>
                  </Typography.Text>
                </Flex>

                {/* Mức tồn so với ngưỡng sắp hết */}
                <div aria-hidden style={{ marginTop: 8, height: 4, borderRadius: 999, background: "#ececea", overflow: "hidden" }}>
                  <div style={{ width: `${Math.max(level === "out" ? 0 : 4, ratio * 100)}%`, height: "100%", borderRadius: 999, background: s.bar }} />
                </div>
              </button>
            </Col>
          );
        })}
      </Row>
    </Card>
  );
}
