import { Button, Col, Empty, Flex, Grid, Modal, Row, Typography } from "antd";
import { useMemo, useState } from "react";
import { formatDelta, unitLabel } from "@/lib/craft/groups";
import { activeSteps, describeSelection, emptySelection, materialNeeds, maxJars, priceSelection, toRecipe, type CraftSelection, type StepSelection } from "@/lib/craft/selection";
import type { CraftConfig } from "@/lib/craft/types";
import { margin, needsCost } from "@/lib/costs";
import { formatMoney, formatNumber } from "@/lib/format";
import type { RecipeLine } from "@/lib/products/types";
import { type MaterialMap } from "@/lib/inventory/stock";
import { validateSelection } from "@/lib/craft/validate";
import { CraftStepSections } from "@/components/orders/craft-step-sections";

export type CustomCandle = { selection: CraftSelection; description: string; price: number; recipe: RecipeLine[] };

type Props = {
  open: boolean;
  config: CraftConfig;
  map: MaterialMap;
  initial?: CraftSelection;
  onCancel: () => void;
  onApply: (candle: CustomCandle) => void;
};

// Cấu hình nến tự phối cho đơn tạo tại BO — đi đúng các bước của trang Thủ công (bản đã lưu).
// Mỗi lựa chọn gắn nguyên liệu trong Kho: hết thì khóa; giá, mô tả, số hũ làm được tự tính.
export function CustomCandleModal({ open, config, map, initial, onCancel, onApply }: Props) {
  const screens = Grid.useBreakpoint();
  const [selection, setSelection] = useState<CraftSelection>(() => ({ ...emptySelection(config), ...initial }));
  const [tried, setTried] = useState(false);
  const steps = activeSteps(config);

  const price = useMemo(() => priceSelection(config, selection), [config, selection]);
  const needs = useMemo(() => materialNeeds(config, selection, map), [config, selection, map]);
  const issues = useMemo(() => validateSelection(config, selection, map), [config, selection, map]);
  const description = describeSelection(config, selection);
  const jars = maxJars(needs, map);
  const cost = useMemo(() => needsCost(needs, map), [needs, map]);
  const profit = margin(price.unit, cost.cost);
  const set = (stepId: string, next: StepSelection) => setSelection((s) => ({ ...s, [stepId]: next }));

  const apply = () => {
    setTried(true);
    if (issues.length) {
      document.getElementById(`cfg-step-${issues[0].stepId}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    onApply({ selection, description, price: price.unit, recipe: toRecipe(needs) });
  };

  return (
    <Modal
      open={open}
      title="Nến tự phối"
      width={screens.md ? 980 : "100%"}
      centered
      onCancel={onCancel}
      destroyOnHidden
      // Tiêu đề và chân luôn hiện, chỉ phần chọn cuộn. Chân màn hẹp xuống 2 hàng nên chừa nhiều hơn.
      // Padding ngang + margin âm bằng nửa gutter của Row: không cuộn ngang, đủ chỗ cho viền focus và thanh cuộn
      styles={{
        body: { paddingBlock: 4, paddingInline: 12, marginInline: -12, maxHeight: `calc(100dvh - ${screens.md ? 168 : 216}px)`, overflowX: "hidden", overflowY: "auto", overscrollBehavior: "contain" },
      }}
      footer={
        <Flex justify="space-between" align="center" gap={12} wrap>
          <Typography.Text type={tried && issues.length ? "danger" : "secondary"} style={{ fontSize: 13 }}>
            {tried && issues.length ? `Còn ${issues.length} bước cần chọn lại` : "Giá theo cấu hình đã lưu ở trang Thủ công."}
          </Typography.Text>
          <Flex gap={8}>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" onClick={apply}>
              {initial ? "Cập nhật nến" : "Thêm vào đơn"} · {formatMoney(price.unit)}
            </Button>
          </Flex>
        </Flex>
      }
    >
      {!steps.length ? (
        <Empty description="Trang Thủ công chưa có bước nào đang hiện." />
      ) : (
        <Row gutter={[24, 16]}>
          <Col xs={24} md={15}>
            <CraftStepSections steps={steps} config={config} selection={selection} map={map} issues={tried ? issues : []} onChange={set} />
          </Col>

          {/* Tóm tắt dính bên phải: mô tả cho xưởng, giá 1 hũ, nguyên liệu trừ kho */}
          <Col xs={24} md={9}>
            <aside className="cfg-summary" aria-label="Tóm tắt nến tự phối">
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Mô tả gửi xưởng
              </Typography.Text>
              <Typography.Paragraph style={{ margin: "2px 0 12px", fontSize: 13 }}>{description || "Chưa chọn gì."}</Typography.Paragraph>

              <Flex vertical gap={4}>
                {price.lines.map((l, k) => (
                  <Flex key={k} justify="space-between" gap={8} style={{ fontSize: 13 }}>
                    <Typography.Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                      {l.label}
                    </Typography.Text>
                    <Typography.Text className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                      {l.base ? formatMoney(l.amount) : formatDelta(l.amount)}
                    </Typography.Text>
                  </Flex>
                ))}
              </Flex>
              <Flex justify="space-between" style={{ borderTop: "1px solid #eee5da", marginTop: 8, paddingTop: 8 }}>
                <Typography.Text strong>Giá 1 hũ</Typography.Text>
                <Typography.Text strong className="tabular">
                  {formatMoney(price.unit)}
                </Typography.Text>
              </Flex>
              <Flex justify="space-between" style={{ paddingTop: 4 }} aria-label="Giá vốn 1 hũ" role="group">
                <Typography.Text type="secondary">Giá vốn nguyên liệu</Typography.Text>
                <Typography.Text type="secondary" className="tabular">
                  {formatMoney(cost.cost)}
                  {profit.percent !== null && ` · lãi ${Math.round(profit.percent * 100)}%`}
                </Typography.Text>
              </Flex>
              {cost.missing.length > 0 && (
                <Typography.Text type="warning" style={{ display: "block", fontSize: 12 }}>
                  Chưa có giá nhập: {cost.missing.map((m) => m.name).join(", ")}
                </Typography.Text>
              )}

              <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, marginTop: 16 }}>
                Nguyên liệu cho 1 hũ (trừ Kho)
              </Typography.Text>
              {needs.size ? (
                <Flex vertical gap={4} style={{ marginTop: 4 }} role="list">
                  {[...needs].map(([id, need]) => {
                    const m = map.get(id)!;
                    const short = m.stock < need;
                    return (
                      <Flex key={id} role="listitem" justify="space-between" gap={8} style={{ fontSize: 13 }}>
                        <Typography.Text ellipsis style={{ fontSize: 13 }}>
                          {m.name}
                        </Typography.Text>
                        <Typography.Text type={short ? "danger" : "secondary"} className="tabular" style={{ fontSize: 13, whiteSpace: "nowrap" }}>
                          {formatNumber(need)} / {formatNumber(m.stock)} {unitLabel[m.unit]}
                        </Typography.Text>
                      </Flex>
                    );
                  })}
                </Flex>
              ) : (
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Chưa có nguyên liệu theo dõi tồn.
                </Typography.Text>
              )}
              <div className="cfg-jars" data-tone={jars === 0 ? "out" : jars <= 5 ? "low" : "ok"} role="status">
                {jars === Infinity ? "Không giới hạn số hũ" : jars === 0 ? "Kho không đủ làm hũ nào" : `Kho đủ làm ${formatNumber(jars)} hũ`}
              </div>
            </aside>
          </Col>
        </Row>
      )}
    </Modal>
  );
}
