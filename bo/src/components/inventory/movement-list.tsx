import { AuditOutlined, BuildOutlined, MinusCircleOutlined, PlusCircleOutlined, ShoppingCartOutlined, TagOutlined } from "@ant-design/icons";
import { Empty, Flex, Typography } from "antd";
import dayjs from "dayjs";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { unitLabel } from "@/lib/craft/groups";
import { formatMoney, formatNumber, formatUnitCost } from "@/lib/format";
import { movementLabels } from "@/lib/inventory/stock";
import type { Material, MovementType, StockMovement } from "@/lib/inventory/types";

const icons: Record<MovementType, { node: ReactNode; color: string; bg: string }> = {
  in: { node: <PlusCircleOutlined />, color: "#237804", bg: "#f6ffed" },
  out: { node: <MinusCircleOutlined />, color: "#a8071a", bg: "#fff1f0" },
  adjust: { node: <AuditOutlined />, color: "#0958d9", bg: "#e6f4ff" },
  order: { node: <ShoppingCartOutlined />, color: "#7a3f17", bg: "#fbf1e8" },
  cost: { node: <TagOutlined />, color: "#595959", bg: "#f5f5f5" },
  make: { node: <BuildOutlined />, color: "#531dab", bg: "#f9f0ff" },
};

// Lịch sử nhập / xuất / kiểm kê; showMaterial = hiện tên nguyên liệu (danh sách chung)
export function MovementList({ items, materials, showMaterial, onOpenMaterial }: { items: StockMovement[]; materials: Material[]; showMaterial?: boolean; onOpenMaterial?: (id: string) => void }) {
  if (!items.length) return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có phiếu kho nào." />;
  return (
    <Flex vertical gap={2} role="list">
      {items.map((mv) => {
        const m = materials.find((x) => x.id === mv.materialId);
        const unit = m ? unitLabel[m.unit] : "";
        const icon = icons[mv.type];
        return (
          <Flex key={mv.id} role="listitem" gap={12} align="flex-start" style={{ padding: "10px 0", borderBottom: "1px solid #f1f1f1" }}>
            <span aria-hidden style={{ display: "grid", placeItems: "center", width: 32, height: 32, borderRadius: "50%", background: icon.bg, color: icon.color, flexShrink: 0 }}>
              {icon.node}
            </span>
            <Flex vertical style={{ flex: 1, minWidth: 0 }}>
              <Typography.Text strong>
                {movementLabels[mv.type]}
                {showMaterial && m && (
                  <>
                    {" · "}
                    {onOpenMaterial ? <Typography.Link onClick={() => onOpenMaterial(m.id)}>{m.name}</Typography.Link> : m.name}
                  </>
                )}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(mv.at).format("HH:mm DD/MM/YYYY")} · {mv.by}
                {mv.orderCode && (
                  <>
                    {" · "}
                    <Link to={`/orders`}>Đơn {mv.orderCode}</Link>
                  </>
                )}
                {mv.batch && ` · Mẻ ${mv.batch}`}
              </Typography.Text>
              {mv.note && <Typography.Text style={{ fontSize: 13 }}>{mv.note}</Typography.Text>}
              {mv.totalCost !== undefined && (
                <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
                  {mv.type === "make" ? `Chi phí mẻ ${formatMoney(mv.totalCost)}` : mv.totalCost === 0 ? "Không mất tiền (hàng tặng, mẫu thử)" : `Tiền lô ${formatMoney(mv.totalCost)}`}
                  {(mv.totalCost > 0 || mv.type === "make") && mv.unitCost !== undefined && ` · ${formatUnitCost(mv.unitCost)}/${unit}`}
                </Typography.Text>
              )}
            </Flex>
            {mv.type === "cost" ? (
              // Sửa giá: không đổi số tồn — hiện giá mới và giá trước đó
              <Flex vertical align="flex-end" style={{ flexShrink: 0 }}>
                <Typography.Text strong className="tabular">
                  {mv.unitCost !== undefined && `${formatUnitCost(mv.unitCost)}/${unit}`}
                </Typography.Text>
                <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
                  {mv.previousCost !== undefined ? `trước ${formatUnitCost(mv.previousCost)}/${unit}` : "trước chưa có giá"}
                </Typography.Text>
              </Flex>
            ) : (
              <Flex vertical align="flex-end" style={{ flexShrink: 0 }}>
                <Typography.Text strong className="tabular" style={{ color: mv.change > 0 ? "#237804" : mv.change < 0 ? "#a8071a" : undefined }}>
                  {mv.change > 0 ? "+" : ""}
                  {formatNumber(mv.change)} {unit}
                </Typography.Text>
                <Typography.Text type="secondary" className="tabular" style={{ fontSize: 12 }}>
                  còn {formatNumber(mv.after)} {unit}
                </Typography.Text>
              </Flex>
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
