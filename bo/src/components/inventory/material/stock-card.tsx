import { EditOutlined } from "@ant-design/icons";
import { App, Button, Flex, Input, InputNumber, Segmented, Tag, Typography } from "antd";
import { useState } from "react";
import { BatchNeeds, BatchPriceInput } from "@/components/inventory/batch-inputs";
import { LotPriceInput, PurchaseInput } from "@/components/inventory/price-inputs";
import type { InventoryApi } from "@/hooks/use-inventory";
import { unitLabel } from "@/lib/craft/groups";
import { averageCost, lotPreview, lotTotal, purchaseCost, purchaseFrom, unitPrice, type LotPrice, type Purchase } from "@/lib/costs";
import { formatCostChange, formatMoney, formatNumber, formatUnitCost } from "@/lib/format";
import { batchError, batchPlan, batchTotal, isMade, type BatchPrice } from "@/lib/inventory/production";
import { categoryLabels, levelMeta, lotPriceRequired, type ManualMovement, manualMovements, materialLevel, movementLabels, movementShort, stockAfter, toMap } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";
import { radius } from "@/theme";

type StockAction = ManualMovement | "make";
const actionLabel = (t: StockAction) => (t === "make" ? "Sản xuất" : movementShort[t]);

// Thẻ đầu drawer: số tồn, giá nhập hiện tại + phiếu nhanh (nhập / sản xuất / xuất / kiểm kê). Nơi duy nhất đổi số tồn và giá
export function StockCard({ material, api, onPending }: { material: Material; api: InventoryApi; onPending: (pending: boolean) => void }) {
  const { message } = App.useApp();
  const [type, setTypeState] = useState<StockAction>("in");
  const [amount, setAmountState] = useState<number | null>(null);
  const [note, setNote] = useState("");
  // Tiền lô nhập — bắt buộc với Nhập thêm (tổng đã trả, hoặc không mất tiền)
  const [lot, setLot] = useState<LotPrice>({});
  // Bấm Ghi nhận khi chưa có tiền lô thì báo đỏ ngay ô tiền
  const [tried, setTried] = useState(false);
  const [editingCost, setEditingCost] = useState(false);
  // Giá mẻ khi Sản xuất: theo nguyên liệu tiêu tốn hoặc tự nhập
  const [batchPrice, setBatchPrice] = useState<BatchPrice>({});
  const level = materialLevel(material);
  const unit = unitLabel[material.unit];
  const actions: readonly StockAction[] = isMade(material) ? ["in", "make", "out", "adjust"] : manualMovements;

  const after = stockAfter(material.stock, type === "make" ? "in" : type, amount);
  const plan = type === "make" ? batchPlan(material.recipe ?? [], amount ?? 0, toMap(api.materials)) : undefined;
  const makeErr = plan ? batchError(plan, batchPrice, amount) : null;
  const makeTotal = plan && amount ? batchTotal(plan, batchPrice) : undefined;
  const makePrice = makeTotal !== undefined && amount ? unitPrice(makeTotal, amount) : undefined;
  const overdraw = type === "out" && amount !== null && amount > material.stock;
  const missingLot = type === "in" && lotTotal(lot) === undefined;
  const lotError = tried && missingLot;
  const makeError = tried && !!makeErr;

  const setType = (t: StockAction) => {
    setTypeState(t);
    setTried(false);
  };
  const preview = type === "in" ? lotPreview(material.stock, material.unitCost, amount, lot) : undefined;

  const setAmount = (v: number | null) => {
    setAmountState(v);
    onPending(v !== null);
  };

  const submit = () => {
    if (amount === null || after === null) return;
    if (type === "make") {
      if (makeErr) return setTried(true);
      api.produce(material.id, amount, makeTotal ?? 0, note);
    } else {
      if (missingLot) return setTried(true);
      api.move(material.id, type, amount, note, type === "in" ? lotTotal(lot) : undefined);
    }
    message.success(`${movementLabels[type]}: ${material.name}`);
    setAmount(null);
    setNote("");
    setLot({});
    setBatchPrice({});
    setTried(false);
  };

  return (
    <section aria-label="Tồn kho hiện tại" style={{ background: "#fff", borderRadius: radius.card, padding: 20 }}>
      <Flex justify="space-between" align="flex-start" gap={12}>
        <Flex vertical style={{ minWidth: 0 }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {categoryLabels[material.category]}
            {material.sku && ` · ${material.sku}`}
          </Typography.Text>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {material.name}
          </Typography.Title>
        </Flex>
        <Tag color={levelMeta[level].color} style={{ marginInlineEnd: 0 }}>
          {levelMeta[level].label}
        </Tag>
      </Flex>
      {material.tracked ? (
        <>
          <span className="big-number" style={{ fontSize: 40, lineHeight: 1.2, display: "block", marginTop: 8 }}>
            {formatNumber(material.stock)}
            <span style={{ fontSize: 16, marginLeft: 6, color: "#6b6b6b" }}>{unit}</span>
          </span>
          <Flex align="center" gap={4} wrap>
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Báo sắp hết khi dưới {formatNumber(material.lowStock)} {unit}
              {" · "}
              {material.unitCost !== undefined ? `Giá nhập bình quân ${formatUnitCost(material.unitCost)}/${unit}` : "Chưa có giá nhập"}
            </Typography.Text>
            {!editingCost && (
              <Button type="link" size="small" icon={<EditOutlined />} onClick={() => setEditingCost(true)} style={{ paddingInline: 4 }}>
                {material.unitCost !== undefined ? "Sửa giá" : "Đặt giá"}
              </Button>
            )}
          </Flex>
          {editingCost && <CostEditor material={material} api={api} onDone={() => setEditingCost(false)} />}

          <Flex vertical gap={8} role="group" aria-label="Ghi phiếu kho" className="sub-panel" style={{ marginTop: 16, background: "#f6f6f3", borderRadius: radius.inner, padding: 12 }}>
            <Segmented<StockAction> block value={type} onChange={setType} options={actions.map((t) => ({ value: t, label: actionLabel(t) }))} />
            <Flex gap={8} wrap>
              <InputNumber
                aria-label={type === "adjust" ? "Số đếm thực tế" : type === "make" ? "Số lượng sản xuất" : "Số lượng"}
                min={0}
                precision={0}
                placeholder={type === "adjust" ? "Số đếm thực tế" : type === "out" ? "Số lượng xuất / hao hụt" : type === "make" ? "Số lượng làm" : "Số lượng nhập"}
                suffix={unit}
                value={amount}
                onChange={setAmount}
                style={{ flex: "1 1 140px" }}
              />
              {type === "in" && <LotPriceInput value={lot} onChange={setLot} status={lotError ? "error" : undefined} />}
            </Flex>
            {plan && (
              <>
                <BatchPriceInput value={batchPrice} onChange={setBatchPrice} auto={amount ? plan.cost : undefined} missing={amount ? plan.missing.map((m) => m.name) : undefined} />
                {amount ? <BatchNeeds lines={plan.lines} /> : null}
              </>
            )}
            <Flex gap={8} wrap>
              <Input aria-label="Ghi chú phiếu" placeholder="Ghi chú (không bắt buộc)" value={note} maxLength={200} onChange={(e) => setNote(e.target.value)} style={{ flex: "1 1 200px" }} />
              <Button type="primary" onClick={submit} disabled={after === null}>
                Ghi nhận
              </Button>
            </Flex>
            {/* Xem trước kết quả trước khi ghi — xuất quá số đang có thì chặn thay vì tự về 0; nhập thiếu tiền lô thì chặn */}
            {amount !== null && (
              <Typography.Text type={overdraw || lotError || makeError ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13 }} role="status">
                {overdraw
                  ? `Chỉ còn ${formatNumber(material.stock)} ${unit} — không xuất quá số đang có. Đếm lại thực tế thì dùng Kiểm kê.`
                  : after === null
                    ? "Nhập số lượng lớn hơn 0."
                    : type === "make"
                      ? (makeErr ??
                        `Sau phiếu: ${formatNumber(after)} ${unit}` +
                          (makeTotal !== undefined && makePrice !== undefined
                            ? ` · chi phí mẻ ${formatMoney(makeTotal)} = ${formatUnitCost(makePrice)}/${unit} · bình quân ${formatCostChange(material.unitCost, averageCost(material.stock, material.unitCost, amount, makePrice))}/${unit}`
                            : ""))
                      : lotError
                        ? lotPriceRequired
                        : `Sau phiếu: ${formatNumber(after)} ${unit}` +
                          (preview
                            ? ` · giá lô ${formatUnitCost(preview.price)}/${unit} · bình quân ${formatCostChange(material.unitCost, preview.average)}/${unit}`
                            : missingLot
                              ? " · ghi tổng tiền lô để tính giá"
                              : "")}
              </Typography.Text>
            )}
          </Flex>
        </>
      ) : (
        <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0" }}>
          Không theo dõi tồn — lựa chọn dùng nguyên liệu này luôn được coi là còn hàng. Giá nhập sửa ở phần Cài đặt tồn kho bên dưới.
        </Typography.Paragraph>
      )}
    </section>
  );
}

// Sửa tay giá nhập bình quân: nhập nhầm tiền lô, hoặc nguyên liệu chưa có giá. Có ghi lịch sử (Sửa giá nhập)
function CostEditor({ material, api, onDone }: { material: Material; api: InventoryApi; onDone: () => void }) {
  const { message } = App.useApp();
  const [buy, setBuy] = useState<Purchase>(() => purchaseFrom(material.unit, material.unitCost));
  const cost = purchaseCost(material.unit, buy);
  const unit = unitLabel[material.unit];

  const save = () => {
    if (cost === undefined) return;
    api.setCost(material.id, cost);
    message.success(`Đã đổi giá nhập ${material.name}: ${formatUnitCost(cost)}/${unit}`);
    onDone();
  };

  return (
    <Flex vertical gap={8} role="group" aria-label="Sửa giá nhập" style={{ marginTop: 12, border: "1px solid #ececec", borderRadius: radius.inner, padding: 12 }}>
      <Typography.Text type="secondary" style={{ fontSize: 13 }}>
        Chỉ dùng khi giá đang sai hoặc chưa có giá — không đổi số tồn. Nhập hàng thì ghi phiếu Nhập thêm kèm tổng tiền, giá tự tính lại.
      </Typography.Text>
      <PurchaseInput unit={material.unit} value={buy} onChange={setBuy} />
      <Flex justify="space-between" align="center" gap={8} wrap>
        <Typography.Text className="tabular" style={{ fontSize: 13 }}>
          {cost !== undefined ? `= ${formatUnitCost(cost)}/${unit}` : "Nhập lượng mua và giá."}
        </Typography.Text>
        <Flex gap={8}>
          <Button size="small" onClick={onDone}>
            Hủy
          </Button>
          <Button size="small" type="primary" onClick={save} disabled={cost === undefined}>
            Lưu giá
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
