import { CopyOutlined, ExperimentOutlined } from "@ant-design/icons";
import { Alert, App, Button, Card, Col, Flex, Form, Grid, InputNumber, Row, Select, Tag, Typography } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { deltaELabel, normHex } from "@/lib/color-mix/color";
import { lighterThanBase, modelAccuracy, pigmentSwatch, solveMixCached, type MixLimit } from "@/lib/color-mix/model";
import { formatGrams, formatPercent, planMix, planText } from "@/lib/color-mix/plan";
import { DEFAULT_PREFS, DEFAULT_WATER, type MixCheck, type MixPrefs, type MixSet, type MixView } from "@/lib/color-mix/types";
import { ColorField } from "./color-field";
import { PigmentChips } from "./pigment-chips";
import { PlanList } from "./plan-list";

// Tab Pha màu: nhập màu muốn có + số gram bột → số gram từng màu, nước cần thêm (docs/pages/color-mix.md#pha-màu).
// Kết hợp: dùng màu của cả hai bộ, giới hạn tổng riêng cho oxit và màu nước
// Nước, độ chính xác cân, tổng màu tối đa lưu theo từng loại (prefs, xuống DB); màu mục tiêu, tổng bột, màu bật chỉ nằm trên trang
export function MixPanel({ mode, set, onAddCheck, prefs, onPrefs }: { mode: MixView; set: MixSet; onAddCheck: (check: MixCheck) => void; prefs: MixPrefs; onPrefs: (patch: MixPrefs) => void }) {
  const { message } = App.useApp();
  const mobile = Grid.useBreakpoint().md === false;
  const [target, setTarget] = useState("#E3D3BC");
  const [plaster, setPlaster] = useState(220);
  // Mặc định đúng tỷ lệ nước khi đổ mẫu (tab Dữ liệu mẫu)
  const sampleWater = set.waterPer100 ?? DEFAULT_WATER;
  const waterPer100 = prefs.water ?? sampleWater;
  const setWater = (v: number | null) => onPrefs({ water: v ?? undefined });
  const precision = prefs.precision ?? DEFAULT_PREFS.precision;
  const setPrecision = (v: number) => onPrefs({ precision: v });
  const maxTotal = prefs.maxTotal ?? DEFAULT_PREFS.maxTotal;
  const setMaxTotal = (v: number) => onPrefs({ maxTotal: v });
  // Kết hợp: maxTotal là giới hạn oxit, maxLiquid là giới hạn màu nước
  const maxLiquid = prefs.maxLiquid ?? DEFAULT_PREFS.maxLiquid;
  const setMaxLiquid = (v: number) => onPrefs({ maxLiquid: v });
  const combo = mode === "combo";
  // Màu tắt (không dùng) — màu mới thêm mặc định được dùng
  const [off, setOff] = useState<string[]>([]);
  const goal = useDeferredValue(normHex(target) ?? "#FFFFFF");
  const term = mode === "oxide" ? "màu oxit" : mode === "liquid" ? "màu nước" : "màu";

  const allowed = useMemo(() => set.pigments.map((p) => p.id).filter((id) => !off.includes(id)), [set.pigments, off]);
  const solution = useMemo(() => {
    if (!combo) return solveMixCached(set, goal, allowed, Math.max(0.1, maxTotal));
    const ids = (kind: string) => set.pigments.filter((p) => p.kind === kind).map((p) => p.id);
    const limits: MixLimit[] = [
      { ids: ids("oxide"), max: Math.max(0, maxTotal) },
      { ids: ids("liquid"), max: Math.max(0, maxLiquid) },
    ];
    return solveMixCached(set, goal, allowed, Math.max(0.1, maxTotal + maxLiquid), limits);
  }, [set, goal, allowed, maxTotal, maxLiquid, combo]);
  const batch = { plaster, waterPer100, precision };
  const plan = planMix(mode, set, solution, batch);
  // Gram màu tối đa khi dùng hết giới hạn: thạch cao = tổng ÷ (1 + Σ % × phần khô), màu = thạch cao × %
  const liquidDry = 1 - (set.waterContent ?? 0) / 100;
  const maxPlaster = plaster / (1 + (combo ? maxTotal + maxLiquid * liquidDry : maxTotal * (mode === "liquid" ? liquidDry : 1)) / 100);
  const maxGrams = (pct: number) => (maxPlaster * pct) / 100;
  const hasLiquid = plan.lines.some((l) => l.kind === "liquid");
  const accuracy = useMemo(() => modelAccuracy(set), [set]);
  const label = deltaELabel(solution.deltaE);
  const swatchOf = (id: string) => pigmentSwatch(set.pigments.find((p) => p.id === id)!);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(planText(mode, goal, solution, plan, batch));
      void message.success("Đã sao chép công thức.");
    } catch {
      void message.error("Trình duyệt không cho sao chép.");
    }
  };

  // Lưu công thức vừa tính thành mẫu kiểm chứng (thạch cao thật + gram màu đã làm tròn theo cân) — đổ xong nhập màu thật ở tab Kiểm chứng
  const saveCheck = () => {
    onAddCheck({
      id: `chk-${Date.now().toString(36)}`,
      name: `Thử ${goal}`,
      plaster: Number(plan.plaster.toFixed(1)),
      grams: Object.fromEntries(plan.lines.map((l) => [l.id, Number(l.rounded.toPrecision(3))])),
      hex: "",
    });
    void message.success("Đã thêm vào tab Kiểm chứng.");
  };

  // Điện thoại: hai nút nằm cuối thẻ, chia đôi bề ngang (đặt ở đầu thẻ thì tràn, che mất tiêu đề)
  const actions = (
    <Flex gap={8} className={mobile ? "color-mix-actions" : undefined}>
      <Button icon={<ExperimentOutlined />} onClick={saveCheck}>
        {mobile ? "Lưu kiểm chứng" : "Lưu làm mẫu kiểm chứng"}
      </Button>
      <Button icon={<CopyOutlined />} onClick={copy}>
        Sao chép
      </Button>
    </Flex>
  );

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={11}>
        <Card title="Màu muốn có">
          <Form layout="vertical" component="div">
            <Form.Item label="Màu mục tiêu">
              <ColorField label="Màu mục tiêu" value={target} onChange={setTarget} whiteRef={set.base} />
            </Form.Item>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item label="Tổng bột cho khuôn (g)" tooltip={`Gồm thạch cao + ${term}. Trang tự trừ phần màu ra khỏi thạch cao để tổng vào khuôn đúng số này, mực khuôn không đổi.`}>
                  <InputNumber min={0} value={plaster} onChange={(v) => setPlaster(v ?? 0)} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="Nước (ml / 100 g tổng bột)">
                  <InputNumber min={0} value={waterPer100} onChange={(v) => setWater(v ?? 0)} style={{ width: "100%" }} />
                </Form.Item>
              </Col>
              {/* Kết hợp: hai ô giới hạn đứng cùng hàng, độ chính xác của cân xuống cuối */}
              <Col span={12} order={combo ? 1 : undefined}>
                <Form.Item label="Độ chính xác của cân">
                  <Select value={precision} onChange={setPrecision} options={[0.001, 0.01, 0.1].map((v) => ({ value: v, label: `${v.toLocaleString("vi-VN")} g` }))} />
                </Form.Item>
              </Col>
              {combo ? (
                <>
                  <Col span={12}>
                    <LimitField
                      label="Oxit tối đa (%)"
                      tooltip="% so với thạch cao. Màu cần đậm hơn mức này thì trang chọn màu gần nhất có thể."
                      extra={`≤ ${formatGrams(maxGrams(maxTotal), 1)}`}
                      value={maxTotal}
                      onChange={setMaxTotal}
                    />
                  </Col>
                  <Col span={12}>
                    <LimitField
                      label="Màu nước tối đa (ml / 100 g)"
                      tooltip="% so với thạch cao. Màu cần đậm hơn mức này thì trang chọn màu gần nhất có thể."
                      extra={`≤ ${formatGrams(maxGrams(maxLiquid), 1, "ml")}`}
                      value={maxLiquid}
                      onChange={setMaxLiquid}
                    />
                  </Col>
                </>
              ) : (
                <Col span={12}>
                  <LimitField
                    label={mode === "liquid" ? "Tổng màu nước tối đa (ml / 100 g thạch cao)" : `Tổng ${term} tối đa (% thạch cao)`}
                    extra={`= tối đa ${formatGrams(maxGrams(maxTotal), 1, mode === "liquid" ? "ml" : "g")} ${term} cho khuôn ${formatGrams(plaster, 0)}`}
                    tooltip={`Giới hạn tổng ${term} khi tìm công thức. Màu cần đậm hơn mức này thì trang chọn màu gần nhất có thể.`}
                    value={maxTotal}
                    onChange={setMaxTotal}
                  />
                </Col>
              )}
            </Row>
            <Form.Item label={`Được dùng các ${term}`} extra={`Đang dùng ${allowed.length} / ${set.pigments.length} màu — bấm để bật / tắt.`} style={{ marginBottom: 0 }}>
              <PigmentChips label={`Được dùng các ${term}`} grouped={combo} pigments={set.pigments} off={off} onToggle={(id, on) => setOff((o) => (on ? o.filter((x) => x !== id) : [...o, id]))} />
            </Form.Item>
          </Form>
        </Card>
      </Col>
      <Col xs={24} lg={13}>
        <Card title="Kết quả" extra={!mobile && actions}>
          <Flex gap={12}>
            <Swatch hex={goal} caption="Màu muốn có" />
            <Swatch hex={solution.hex} caption={`Dự đoán sau khi khô · ${solution.hex}`} />
          </Flex>
          <Flex justify="space-between" align="center" wrap gap={8} style={{ margin: "12px 0" }}>
            <Typography.Text>
              Độ lệch màu ΔE: <b>{solution.deltaE.toFixed(2)}</b>
            </Typography.Text>
            <Tag color={label.color}>{label.text}</Tag>
          </Flex>
          <PlanList plan={plan} batch={batch} swatchOf={swatchOf} />
          <Flex vertical gap={8} style={{ marginTop: 12 }}>
            {waterPer100 !== sampleWater && (
              <Alert
                type="warning"
                showIcon
                title={`Đang pha ${waterPer100} ml nước / 100 g tổng bột, khác lúc đổ mẫu (${sampleWater} ml)`}
                description={`Màu khô sẽ ${waterPer100 > sampleWater ? "sáng" : "đậm"} hơn dự đoán. Pha đúng tỷ lệ lúc đổ mẫu, hoặc đổ lại mẫu ở tỷ lệ mới.`}
                action={
                  <Button size="small" onClick={() => setWater(null)}>
                    Dùng {sampleWater} ml
                  </Button>
                }
              />
            )}
            {lighterThanBase(set, goal) && <Alert type="error" showIcon title="Màu này sáng hơn mẫu trắng. Màu chỉ làm đậm lên — cần thêm bột trắng (titan dioxit) hoặc loại bột trắng hơn." />}
            {!lighterThanBase(set, goal) && solution.deltaE > 5 && (
              <Alert type="warning" showIcon title={`Bộ ${term} đang bật chưa tạo được màu này. Thử bật thêm màu, tăng giới hạn tổng, hoặc thêm một màu có sắc gần màu mục tiêu.`} />
            )}
            {plan.totalPercent > 8 && <Alert type="error" showIcon title={`Tổng ${term} ${formatPercent(plan.totalPercent)} khá cao, có thể làm thạch cao yếu hoặc ninh kết bất thường.`} />}
            {plan.totalPercent > 5 && plan.totalPercent <= 8 && <Alert type="warning" showIcon title={`Tổng ${term} ${formatPercent(plan.totalPercent)}, nên đổ thử mẫu nhỏ để kiểm tra độ cứng.`} />}
            {hasLiquid && !combo && <Alert type="info" showIcon title="Trộn màu nước vào nước trước rồi mới đổ bột, để màu phân tán đều." />}
            {combo && hasLiquid && plan.lines.some((l) => l.kind === "oxide") && (
              <Alert type="info" showIcon title="Oxit trộn đều vào bột thạch cao khô, màu nước khuấy vào nước trước — rồi mới đổ bột vào nước." />
            )}
            {combo && !accuracy && (
              <Alert type="info" showIcon title="Dự đoán ghép từ hai bộ đo riêng (chưa có mẫu trộn chung) nên kém chắc hơn. Đổ thử rồi bấm “Lưu làm mẫu kiểm chứng” để biết lệch bao nhiêu." />
            )}
            {accuracy && <Alert type="info" showIcon title={`Trên ${accuracy.count} mẫu kiểm chứng, dự đoán lệch trung bình ΔE ${accuracy.mean.toFixed(1)} so với màu thật.`} />}
          </Flex>
          {mobile && actions}
        </Card>
      </Col>
    </Row>
  );
}

function Swatch({ hex, caption }: { hex: string; caption: string }) {
  return (
    <div style={{ flex: 1 }}>
      <div className="color-mix-swatch" style={{ background: hex }} />
      <Typography.Text type="secondary" className="color-mix-caption">
        {caption}
      </Typography.Text>
    </div>
  );
}

function LimitField({ label, extra, tooltip, value, onChange }: { label: string; extra: string; tooltip?: string; value: number; onChange: (v: number) => void }) {
  return (
    <Form.Item label={label} extra={extra} tooltip={tooltip}>
      <InputNumber min={0} step={0.5} value={value} onChange={(v) => onChange(v ?? 6)} style={{ width: "100%" }} />
    </Form.Item>
  );
}
