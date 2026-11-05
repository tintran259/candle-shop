import { Col, Form, InputNumber, Row, Typography, type FormRule } from "antd";
import { FormSection, SwitchField } from "@/components/form/form-section";
import { BatchNeeds, BatchPriceInput } from "@/components/inventory/batch-inputs";
import { SubPanel } from "@/components/inventory/material/parts";
import { LotPriceInput, PurchaseInput } from "@/components/inventory/price-inputs";
import { unitLabel } from "@/lib/craft/groups";
import type { Unit } from "@/lib/craft/types";
import { lotPreview, lotTotal, type LotPrice } from "@/lib/costs";
import { formatMoney, formatUnitCost } from "@/lib/format";
import type { batchPlan } from "@/lib/inventory/production";
import { lotPriceRequired } from "@/lib/inventory/stock";
import type { Material } from "@/lib/inventory/types";

// Tạo mới: có tồn ban đầu thì bắt buộc tiền đã trả; ghi tiền mà tồn 0 thì không chia ra được giá mỗi đơn vị
const openingRule: FormRule = ({ getFieldValue }) => ({
  validator: (_, v?: LotPrice) => {
    const stock = getFieldValue("stock") ?? 0;
    if (stock > 0 && lotTotal(v) === undefined) return Promise.reject(new Error(lotPriceRequired));
    if (!stock && v?.total && !v.free) return Promise.reject(new Error("Nhập tồn ban đầu để chia ra giá mỗi đơn vị."));
    return Promise.resolve();
  },
});

type Props = {
  material?: Material;
  // Xưởng tự sản xuất
  made: boolean;
  tracked?: boolean;
  unit: Unit;
  // Mẻ đầu khi tạo mới dạng sản xuất
  makeRule: FormRule;
  makeCount?: number | null;
  plan: ReturnType<typeof batchPlan>;
  makeTotal?: number;
  makeUnit?: number;
  // Tồn ban đầu và giá chia ra khi tạo mới nguyên liệu mua về
  openingStock?: number;
  openingCost?: ReturnType<typeof lotPreview>;
  // Giá nhập của nguyên liệu không theo dõi tồn
  buyCost?: number;
};

// Khối Tồn kho: theo dõi tồn, mẻ đầu / nhập kho lần đầu (tạo mới), ngưỡng sắp hết, giá nhập khi không theo dõi tồn
export function StockFields({ material, made, tracked, unit, makeRule, makeCount, plan, makeTotal, makeUnit, openingStock, openingCost, buyCost }: Props) {
  // Nguyên liệu đã có: chỉ cài đặt (theo dõi, ngưỡng) — nhập / xuất và giá nằm ở thẻ tồn kho trên cùng
  return (
    <FormSection title={material ? "Cài đặt tồn kho" : "Tồn kho"} description={material ? "Số tồn và giá nhập đổi qua phiếu ở thẻ trên cùng để luôn có lịch sử." : undefined}>
      {!made && <SwitchField name="tracked" label="Theo dõi tồn kho" description="Tắt cho mục không cần đếm (vd “Không mùi”) — luôn coi là còn hàng." last={!tracked} />}
      {made || tracked ? (
        <>
          {/* Tạo mới dạng sản xuất: làm mẻ đầu — số lượng làm là tồn ban đầu, trừ nguyên liệu theo công thức */}
          {!material && made && (
            <SubPanel title="Mẻ đầu tiên" description="Làm luôn khi tạo — số lượng làm là tồn ban đầu. Để 0 nếu chưa làm, sản xuất sau ở thẻ tồn kho.">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={9}>
                  <Form.Item name="makeCount" label="Số lượng sản xuất" rules={[makeRule]} style={{ marginBottom: 0 }}>
                    <InputNumber min={0} precision={0} suffix={unitLabel[unit]} aria-label="Số lượng sản xuất" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={15}>
                  <Form.Item name="makePrice" label="Giá" style={{ marginBottom: 0 }}>
                    <BatchPriceInput auto={makeCount ? plan.cost : undefined} missing={makeCount ? plan.missing.map((m) => m.name) : undefined} />
                  </Form.Item>
                </Col>
              </Row>
              {makeCount ? <BatchNeeds lines={plan.lines} /> : null}
              {makeTotal !== undefined && makeUnit !== undefined && (
                <Typography.Text strong className="tabular" role="status">
                  Chi phí mẻ {formatMoney(makeTotal)} = {formatUnitCost(makeUnit)}/{unitLabel[unit]}
                  <Typography.Text type="secondary" style={{ fontWeight: 400, fontSize: 13 }}>
                    {" "}
                    — giá ban đầu của thành phẩm.
                  </Typography.Text>
                </Typography.Text>
              )}
            </SubPanel>
          )}
          {/* Tạo mới: lần nhập đầu tiên — số lượng và tiền đã trả nằm cạnh nhau, tự chia ra giá mỗi đơn vị */}
          {!material && !made && (
            <SubPanel title="Nhập kho lần đầu" description="Số đang có và tiền đã trả cho số đó — hệ thống tự chia ra giá mỗi đơn vị." style={{ marginTop: 16 }}>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={9}>
                  <Form.Item name="stock" label="Tồn ban đầu" style={{ marginBottom: 0 }}>
                    <InputNumber min={0} precision={0} suffix={unitLabel[unit]} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={15}>
                  <Form.Item
                    name="opening"
                    label="Tổng tiền đã trả"
                    required={!!openingStock}
                    rules={[openingRule]}
                    // Chỉ kiểm tra khi bấm Thêm vào kho (gõ tiền trước số tồn không bị báo đỏ giữa chừng)
                    validateTrigger={false}
                    extra={
                      openingCost
                        ? `= ${formatUnitCost(openingCost.price)}/${unitLabel[unit]} — giá nhập ban đầu, dùng tính giá vốn.`
                        : openingStock
                          ? "Tiền mua số tồn ban đầu, hệ thống tự chia ra giá mỗi đơn vị."
                          : "Chưa có hàng thì để trống — giá có từ phiếu Nhập thêm đầu tiên."
                    }
                    style={{ marginBottom: 0 }}
                  >
                    <LotPriceInput label="Tổng tiền đã trả" />
                  </Form.Item>
                </Col>
              </Row>
            </SubPanel>
          )}
          <Row gutter={16} style={{ marginTop: made && material ? 0 : 16 }}>
            <Col xs={24} sm={9}>
              <Form.Item name="lowStock" label="Báo sắp hết khi dưới" style={{ marginBottom: 0 }}>
                <InputNumber min={0} precision={0} suffix={unitLabel[unit]} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>
        </>
      ) : (
        <Form.Item
          name="buy"
          label="Giá nhập"
          extra={
            buyCost !== undefined
              ? `= ${formatUnitCost(buyCost)}/${unitLabel[unit]}. Dùng tính giá vốn và lãi gộp.`
              : "Không theo dõi tồn nên không có phiếu nhập — ghi lần mua gần nhất, hệ thống tự chia ra giá mỗi đơn vị. Bỏ trống nếu không tốn tiền."
          }
          style={{ marginTop: 16, marginBottom: 0 }}
        >
          <PurchaseInput unit={unit} />
        </Form.Item>
      )}
    </FormSection>
  );
}
