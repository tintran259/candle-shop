// Chuyển qua lại giữa Discount và giá trị phẳng của antd Form
import dayjs, { type Dayjs } from "dayjs";
import { normalizeCode } from "@/lib/discounts/labels";
import type { Discount, DiscountScope, DiscountType } from "@/lib/discounts/types";

export type DiscountFormValues = {
  code: string;
  description?: string;
  type: DiscountType;
  percent?: number;
  amount?: number;
  maxDiscount?: number | null;
  minOrder?: number | null;
  scope: DiscountScope;
  firstOrderOnly: boolean;
  startsAt: Dayjs;
  endsAt?: Dayjs | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  active: boolean;
};

export function toFormValues(d?: Discount): DiscountFormValues {
  return {
    code: d?.code ?? "",
    description: d?.description,
    type: d?.type ?? "percent",
    percent: d?.type === "percent" ? d.value : 10,
    amount: d?.type === "fixed" ? d.value : 50_000,
    maxDiscount: d?.maxDiscount ?? null,
    minOrder: d?.minOrder ?? null,
    scope: d?.scope ?? "all",
    firstOrderOnly: d?.firstOrderOnly ?? false,
    startsAt: dayjs(d?.startsAt),
    endsAt: d?.endsAt ? dayjs(d.endsAt) : null,
    usageLimit: d?.usageLimit ?? null,
    perCustomerLimit: d?.perCustomerLimit ?? 1,
    active: d?.active ?? true,
  };
}

const orUndef = (n?: number | null) => (n ? n : undefined);

export function fromFormValues(v: DiscountFormValues, previous?: Discount): Discount {
  const code = normalizeCode(v.code);
  return {
    // id riêng, không suy ra từ mã — để đổi tên mã hay tạo mã trùng tên không ghi đè mã khác
    id: previous?.id ?? `disc-${Date.now().toString(36)}`,
    code,
    description: v.description?.trim() || undefined,
    type: v.type,
    value: v.type === "percent" ? (v.percent ?? 0) : v.type === "fixed" ? (v.amount ?? 0) : 0,
    maxDiscount: v.type === "percent" ? orUndef(v.maxDiscount) : undefined,
    minOrder: orUndef(v.minOrder),
    scope: v.scope,
    firstOrderOnly: v.firstOrderOnly,
    startsAt: (v.startsAt ?? dayjs()).format("YYYY-MM-DD"),
    endsAt: v.endsAt ? v.endsAt.format("YYYY-MM-DD") : undefined,
    usageLimit: orUndef(v.usageLimit),
    perCustomerLimit: orUndef(v.perCustomerLimit),
    used: previous?.used ?? 0,
    active: v.active,
    createdAt: previous?.createdAt ?? dayjs().format("YYYY-MM-DD"),
  };
}
