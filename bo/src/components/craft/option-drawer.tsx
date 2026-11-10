import { DeleteOutlined } from "@ant-design/icons";
import { App, Button, Drawer, Flex, Form, Grid, Popconfirm, Typography } from "antd";
import { useDeferredValue, useMemo, useState } from "react";
import { MaterialPreview } from "@/components/craft/material-preview";
import { fromFormValues, NEW_MATERIAL, sizesFromForm, toFormValues, vesselRows, type OptionFormValues, type ResolvedMaterials, type SizeValues } from "@/components/craft/option-form";
import { BasicFields, ImageFields, LookFields, MaterialFields, RuleFields } from "@/components/craft/option/option-sections";
import { PriceFields } from "@/components/craft/option/price-fields";
import { VesselFields } from "@/components/craft/option/vessel-fields";
import { DrawerFormSkeleton } from "@/components/skeletons";
import { uploadError, uploadImages } from "@/lib/craft/image";
import type { CraftConfigApi } from "@/hooks/use-craft-config";
import { lidCheck, optionCheck, vesselSizeChecks, type SizeCheck } from "@/lib/craft/pricing";
import { stepAmounts, vesselStep } from "@/lib/craft/selection";
import { lotTotal, unitPrice } from "@/lib/costs";
import { DEFAULT_LOW_STOCK, toMap } from "@/lib/inventory/stock";
import type { Material, MaterialCategory } from "@/lib/inventory/types";
import { amountBasis, basisLabel, isOptionStep, previewRoleMeta, uniqueId } from "@/lib/craft/steps";
import { type CraftConfig, type OptionStep, type StepOption, type Unit, type VesselOption } from "@/lib/craft/types";
import type { ShopSettings } from "@/lib/settings/types";

type Props = {
  open: boolean;
  step: OptionStep;
  option?: StepOption;
  config: CraftConfig;
  api: CraftConfigApi;
  materials: Material[];
  pricing: Pick<ShopSettings, "minMargin" | "priceMarkup">;
  onClose: () => void;
};

// Loại nguyên liệu gợi ý khi tạo mới từ bước (theo vai trò minh họa / component)
const suggestCategory = (step: OptionStep): MaterialCategory =>
  step.kind === "vessel"
    ? "vessel"
    : step.kind === "blend"
      ? "fragrance"
      : step.kind === "swatches"
        ? "dye"
        : "previewRole" in step && step.previewRole === "wick"
          ? "wick"
          : step.kind === "cards" && step.gramsPerGram
            ? "wax"
            : "other";

// Drawer thêm/sửa một lựa chọn: thẻ xem trước + các khối trường theo component của bước.
// Mount lại theo key mỗi lần mở nên form luôn bắt đầu từ dữ liệu mới.
export function OptionDrawer({ open, step, option, config, api, materials, pricing, onClose }: Props) {
  const { message, modal } = App.useApp();
  const screens = Grid.useBreakpoint();
  // Drawer trượt ra ngay với khung xương; form (nặng) mount ngay sau ở chế độ ưu tiên thấp
  const ready = useDeferredValue(true, false);
  const [form] = Form.useForm<OptionFormValues>();
  const materialId = Form.useWatch("materialId", form);
  const hasSwatch = Form.useWatch("hasSwatch", form);
  const hasImage = !!Form.useWatch("images", form)?.length;
  const [dirty, setDirty] = useState(false);
  const price = Form.useWatch("price", form);
  const isVessel = step.kind === "vessel";
  // Sáp, màu, hương: giá bán mỗi 100 g / mỗi ml, khách trả theo lượng dùng cho hũ
  const basis = amountBasis(step);
  const perLabel = basis && basisLabel(basis);
  const priceLabel = isVessel ? "Giá hũ" : perLabel ? `Giá bán / ${perLabel}` : "Phụ thu mỗi hũ";
  const jarType = Form.useWatch("jarType", form);
  const hasLid = Form.useWatch("hasLid", form);
  const sizeValues = Form.useWatch("sizes", form) as Record<string, SizeValues> | undefined;
  const lidPrice = Form.useWatch("lidPrice", form) as number | null | undefined;
  const map = useMemo(() => toMap(materials), [materials]);
  // Hũ: các cỡ theo loại hũ đang chọn (cỡ đã có + mã hũ cùng loại trong Kho)
  const rows = useMemo(() => (isVessel ? vesselRows(option as VesselOption | undefined, jarType, materials) : []), [isVessel, option, jarType, materials]);
  // Giá vốn tối thiểu theo giá và nguyên liệu đang nhập (chưa cần Áp dụng)
  const priceCheck = useMemo(() => {
    if (isVessel) return null;
    const draft = {
      ...(option ?? { id: "__draft", name: { vi: "", en: "" }, available: true }),
      ...(basis ? { priceDelta: 0, unitPrice: Math.round(price ?? 0) } : { priceDelta: Math.round(price ?? option?.priceDelta ?? 0) }),
      materialId: materialId && materialId !== NEW_MATERIAL ? materialId : undefined,
    } as StepOption;
    return optionCheck(config, step, draft, map);
  }, [isVessel, basis, step, option, price, materialId, config, map]);
  // Ví dụ giá theo lượng ở cỡ hũ nhỏ nhất đang bán: "120 g × 18.000 ₫/100 g = 21.600 ₫"
  const sample = useMemo(() => {
    if (!basis) return null;
    const sizes = (vesselStep(config)?.options ?? []).filter((v) => v.available).flatMap((v) => v.sizes.filter((s) => s.available).map((s) => ({ v, s })));
    const first = sizes.sort((a, b) => a.s.grams - b.s.grams)[0];
    if (!first) return null;
    const sel =
      step.kind === "blend"
        ? { kind: "blend" as const, items: [{ optionId: "x", weight: 1 }], intensity: step.intensity ? ("medium" as const) : null }
        : { kind: step.kind as "cards", optionIds: ["x"] };
    const amount = stepAmounts(step, sel, first.s.grams).get("x") ?? 0;
    return { jar: `${first.v.name.vi} ${first.s.ml}ml`, grams: first.s.grams, amount: Math.round(amount * 10) / 10 };
  }, [basis, config, step]);
  const sizeChecks = useMemo(() => {
    if (!isVessel) return new Map<string, SizeCheck>();
    const draft = {
      ...(option ?? { id: "__draft", name: { vi: "", en: "" }, available: true, shape: "jar", lid: null }),
      priceDelta: Math.round(price ?? option?.priceDelta ?? 0),
      sizes: sizesFromForm(rows, sizeValues, !!hasLid, !option),
    } as VesselOption;
    return vesselSizeChecks(config, step, draft, map);
  }, [isVessel, step, option, price, rows, sizeValues, hasLid, config, map]);
  // Phụ thu nắp so với giá vốn mã nắp của từng cỡ đang bán
  const lidPriceCheck = useMemo(() => {
    if (!isVessel || !hasLid) return null;
    const draft = { lid: { priceDelta: Math.round(lidPrice ?? 0) }, sizes: sizesFromForm(rows, sizeValues, true, !option) } as VesselOption;
    return lidCheck(draft, map);
  }, [isVessel, hasLid, lidPrice, rows, sizeValues, option, map]);
  const role = step.kind === "cards" || step.kind === "swatches" ? step.previewRole : undefined;
  const looks = role ? previewRoleMeta[role].looks : undefined;
  // Bước khác có lựa chọn — để đặt quy tắc "chỉ dùng với"
  const others = config.steps.filter((s) => s.id !== step.id && isOptionStep(s)) as OptionStep[];

  const requestClose = () => {
    if (!dirty) return onClose();
    modal.confirm({
      title: "Bỏ các thay đổi chưa lưu?",
      content: "Những gì bạn vừa sửa sẽ không được lưu lại.",
      okText: "Bỏ thay đổi",
      okButtonProps: { danger: true },
      cancelText: "Tiếp tục sửa",
      onOk: onClose,
    });
  };

  const [saving, setSaving] = useState(false);
  const finish = async (raw: OptionFormValues) => {
    if (saving) return;
    // Ảnh mới chọn tải lên kho ảnh lúc này (trước mọi thay đổi khác — lỗi thì drawer giữ nguyên)
    setSaving(true);
    let values: OptionFormValues;
    try {
      values = { ...raw, images: await uploadImages(raw.images, "craft") };
    } catch (e) {
      return message.error(uploadError(e));
    } finally {
      setSaving(false);
    }
    // Chọn "Tạo mới" thì tạo nguyên liệu trong bản nháp (tồn ban đầu admin nhập), lựa chọn trỏ tới id đó.
    // Nguyên liệu chỉ thật sự vào Kho khi bấm Lưu trên trang — Bỏ thay đổi thì không sót lại gì.
    const name = values.nameVi.trim();
    const en = values.nameEn?.trim() || name;
    const taken = materials.map((m) => m.id);
    const create = (key: string, materialName: string, unit: Unit, stock: number | undefined, category: MaterialCategory, swatch?: string) => {
      const id = uniqueId(key, taken, "material");
      taken.push(id);
      const count = Math.max(0, Math.round(stock ?? 0));
      // Tiền đã trả cho tồn ban đầu → giá nhập ban đầu (Kho ghi vào phiếu "Tồn ban đầu" khi bấm Lưu)
      const total = count > 0 ? lotTotal(values.newOpening) : undefined;
      const openingTotal = total === undefined ? undefined : Math.round(total);
      const unitCost = openingTotal === undefined ? undefined : unitPrice(openingTotal, count);
      api.addPendingMaterial({ id, name: materialName, category, unit, tracked: true, stock: count, lowStock: DEFAULT_LOW_STOCK[unit], swatch, unitCost, openingTotal });
      return id;
    };
    const pick = (value: string | undefined, make: () => string) => (value === NEW_MATERIAL ? make() : value || undefined);
    const swatch = values.hasSwatch ? values.swatch : undefined;

    const resolved: ResolvedMaterials = {};
    if (step.kind === "vessel") {
      // Mỗi cỡ là một mã hũ cùng Loại hũ trong Kho
      resolved.sizes = sizesFromForm(rows, values.sizes, !!values.hasLid, !option);
    } else {
      resolved.materialId = pick(values.materialId, () => create(`${step.id} ${en}`, name, values.newUnit ?? "pcs", values.newStock, suggestCategory(step), swatch));
    }
    const next = fromFormValues(step, values, resolved, option);
    if (!api.saveOption(step.id, next, option?.id)) return message.error("Bộ nhớ trình duyệt đã đầy — bớt ảnh rồi lưu lại.");
    const created = taken.length - materials.length;
    message.success(`${option ? "Đã cập nhật" : "Đã thêm"} ${next.name.vi}${created ? ` (+${created} nguyên liệu mới, vào Kho khi Lưu)` : ""} — bấm “Lưu thay đổi” để lên web.`);
    onClose();
  };

  const remove = () => {
    if (!option) return;
    api.removeOption(step.id, option.id);
    message.success(`Đã xóa ${option.name.vi}`);
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={requestClose}
      title={option ? `Sửa lựa chọn · ${step.title.vi}` : `Thêm lựa chọn · ${step.title.vi}`}
      size={screens.sm === false ? "100%" : 640}
      destroyOnHidden
      styles={{ header: { background: "#fff" }, body: { padding: 16 }, footer: { background: "#fff" } }}
      footer={
        <Flex gap={8} align="center">
          {option && (
            <Popconfirm title={`Xóa “${option.name.vi}”?`} description="Khách sẽ không chọn được mục này nữa." okText="Xóa" okButtonProps={{ danger: true }} cancelText="Hủy" onConfirm={remove}>
              <Button danger type="text" icon={<DeleteOutlined />}>
                Xóa
              </Button>
            </Popconfirm>
          )}
          {dirty && (
            <Typography.Text type="secondary" style={{ fontSize: 13 }}>
              Có thay đổi chưa lưu
            </Typography.Text>
          )}
          <Button onClick={requestClose} style={{ marginLeft: "auto" }}>
            Hủy
          </Button>
          <Button type="primary" loading={saving} onClick={() => form.submit()}>
            {option ? "Áp dụng" : "Thêm lựa chọn"}
          </Button>
        </Flex>
      }
    >
      {ready ? (
        <Form
          form={form}
          layout="vertical"
          initialValues={toFormValues(step, option, materials)}
          onFinish={finish}
          onValuesChange={() => setDirty(true)}
          scrollToFirstError={{ behavior: "smooth", block: "center", focus: true }}
        >
          <Flex vertical gap={16}>
            <MaterialPreview materials={materials} groupLabel={step.title.vi} rows={isVessel ? rows : undefined} priceLabel={priceLabel} />

            <BasicFields />

            {/* Chọn nguyên liệu trước: giá vốn và gợi ý giá ở khối Giá & bán tính theo nguyên liệu này */}
            {step.kind !== "vessel" && <MaterialFields materials={materials} materialId={materialId} />}

            {/* Hũ: chọn loại hũ & kích thước trước rồi mới đặt giá bán */}
            {isVessel && (
              <VesselFields
                rows={rows}
                isNew={!option}
                materials={materials}
                checks={sizeChecks}
                lid={lidPriceCheck}
                onLidPrice={(n) => {
                  form.setFieldValue("lidPrice", n);
                  setDirty(true);
                }}
                pricing={pricing}
                jarPrice={Math.round(price ?? 0)}
                onPrice={(key, n) => {
                  form.setFieldValue(["sizes", key, "price"], n);
                  setDirty(true);
                }}
              />
            )}

            <PriceFields
              form={form}
              isVessel={isVessel}
              basis={basis}
              perLabel={perLabel}
              priceLabel={priceLabel}
              price={price}
              sample={sample}
              priceCheck={priceCheck}
              pricing={pricing}
              setDirty={setDirty}
            />

            <ImageFields step={step} role={role} hasImage={hasImage} hasSwatch={hasSwatch} />

            {looks && <LookFields role={role!} looks={looks} />}

            {step.kind !== "vessel" && <RuleFields others={others} />}
          </Flex>
        </Form>
      ) : (
        <DrawerFormSkeleton />
      )}
    </Drawer>
  );
}
