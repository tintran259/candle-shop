// Chuyển file sao lưu của BO (Cài đặt › Sao lưu dữ liệu) thành dữ liệu cho từng bảng Prisma.
// Hàm thuần, không đụng DB — test được riêng. Ghi vào DB ở scripts/import-backup.ts.
// Dữ liệu tham chiếu tới mục đã xóa (vd công thức trỏ tới nguyên liệu không còn) được bỏ qua và ghi vào warnings.

type J = any;

export type BackupFile = { app: string; version: number; exportedAt: string; data: Record<string, string> };

const KEYS = {
  settings: "bo-settings-v1",
  categories: "bo-categories-v1",
  products: "bo-products-v2",
  inventory: "bo-inventory-v2",
  customers: "bo-customers-v1",
  discounts: "bo-discounts-v1",
  orders: "bo-orders-v4",
  cancelled: "bo-cancelled-products-v4",
  craft: "bo-craft-builder-v5",
  craftDraft: "bo-craft-builder-v5-draft",
  craftPending: "bo-craft-builder-v5-new-materials",
  orderDraft: "bo-order-draft-v1",
  notifications: "bo-notifications-read-v1",
} as const;

const read = (file: BackupFile, key: string): J => {
  const raw = file.data[key];
  if (raw === undefined || raw === "") return undefined;
  return JSON.parse(raw);
};

const int = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? Math.round(n) : undefined);
const num = (n: unknown) => (typeof n === "number" && Number.isFinite(n) ? n : undefined);
const date = (s: unknown) => (typeof s === "string" && s ? new Date(s) : undefined);
const str = (s: unknown) => (typeof s === "string" && s !== "" ? s : undefined);

export function mapBackup(file: BackupFile) {
  if (file?.app !== "2510-bo" || file.version !== 1 || !file.data) throw new Error("Không phải file sao lưu của 2510 Back Office.");
  const warnings: string[] = [];
  const now = new Date(file.exportedAt || Date.now());

  // ---- Cài đặt
  const s: J = read(file, KEYS.settings) ?? {};
  const settings = {
    id: "shop",
    depositPercent: int(s.depositPercent) ?? 50,
    maxDeliveryAttempts: int(s.maxDeliveryAttempts) ?? 3,
    resendFee: int(s.resendFee) ?? 30000,
    dailyCapacity: int(s.dailyCapacity) ?? 20,
    leadDays: int(s.leadDays) ?? 3,
    minMargin: int(s.minMargin) ?? 50,
    priceMarkup: num(s.priceMarkup) ?? 2.5,
    senderName: s.sender?.name ?? "2510 Candle",
    senderPhone: s.sender?.phone ?? "",
    senderAddress: s.sender?.address ?? "",
  };
  const shippingOptions = ((s.shippingOptions ?? []) as J[]).map((o, i) => ({ id: o.id, name: o.name, fee: int(o.fee) ?? 0, days: int(o.days) ?? 0, enabled: o.enabled !== false, sortOrder: i }));
  const carriers = ((s.carriers ?? []) as J[]).map((c, i) => ({ id: c.id, name: c.name, trackingUrl: str(c.trackingUrl) ?? null, requireCode: c.requireCode !== false, enabled: c.enabled !== false, sortOrder: i }));

  // ---- Kho
  const inv: J = read(file, KEYS.inventory) ?? { materials: [], movements: [] };
  const materialList = ((inv.materials ?? []) as J[]).filter((m) => !m.draft);
  const materialIds = new Set(materialList.map((m) => m.id));
  const materials = materialList.map((m) => ({
    id: m.id,
    name: m.name,
    sku: str(m.sku) ?? null,
    category: m.category,
    unit: m.unit,
    tracked: m.tracked !== false,
    stock: num(m.stock) ?? 0,
    lowStock: num(m.lowStock) ?? 0,
    unitCost: num(m.unitCost) ?? null,
    jarType: str(m.jarType) ?? null,
    capacity: int(m.capacity) ?? null,
    swatch: str(m.swatch) ?? null,
    note: str(m.note) ?? null,
    updatedAt: date(m.updatedAt) ?? now,
  }));
  const recipeLines = (owner: string, lines: J[] | undefined, label: string) =>
    (lines ?? []).flatMap((r, i) => {
      if (!materialIds.has(r.materialId)) {
        warnings.push(`${label} ${owner}: bỏ dòng công thức trỏ tới nguyên liệu không còn (${r.materialId})`);
        return [];
      }
      return [{ materialId: r.materialId, quantity: num(r.quantity) ?? 0, sortOrder: i }];
    });
  const materialRecipe = materialList.flatMap((m) => recipeLines(m.id, m.recipe, "Nguyên liệu").map((r) => ({ materialId: m.id, componentId: r.materialId, quantity: r.quantity, sortOrder: r.sortOrder })));
  const movements = ((inv.movements ?? []) as J[]).flatMap((mv) => {
    if (!materialIds.has(mv.materialId)) {
      warnings.push(`Bỏ phiếu kho ${mv.id} của nguyên liệu không còn (${mv.materialId})`);
      return [];
    }
    return [
      {
        id: mv.id,
        materialId: mv.materialId,
        type: mv.type,
        change: num(mv.change) ?? 0,
        after: num(mv.after) ?? 0,
        note: str(mv.note) ?? null,
        orderCode: str(mv.orderCode) ?? null,
        totalCost: int(mv.totalCost) ?? null,
        unitCost: num(mv.unitCost) ?? null,
        previousCost: num(mv.previousCost) ?? null,
        batch: str(mv.batch) ?? null,
        by: mv.by ?? "",
        at: date(mv.at) ?? now,
      },
    ];
  });

  // ---- Danh mục, sản phẩm
  const categoryList: J[] = read(file, KEYS.categories) ?? [];
  const categories = categoryList.map((c, i) => ({ id: c.id, nameVi: c.name?.vi ?? c.id, nameEn: c.name?.en ?? c.name?.vi ?? c.id, color: c.color ?? "default", hidden: !!c.hidden, sortOrder: i }));
  const categoryIds = new Set(categories.map((c) => c.id));
  const productList: J[] = read(file, KEYS.products) ?? [];
  for (const p of productList)
    if (!categoryIds.has(p.categoryId)) {
      warnings.push(`Sản phẩm ${p.id}: danh mục ${p.categoryId} không còn — tạo danh mục cùng mã`);
      categories.push({ id: p.categoryId, nameVi: p.categoryId, nameEn: p.categoryId, color: "default", hidden: false, sortOrder: categories.length });
      categoryIds.add(p.categoryId);
    }
  const products = productList.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: str(p.description) ?? null,
    price: int(p.price) ?? 0,
    salePrice: int(p.salePrice) ?? null,
    images: p.images ?? [],
    categoryId: p.categoryId,
    aromaLevel: p.aromaLevel ?? "medium",
    size: p.size ?? "medium",
    scent: str(p.scent) ?? null,
    waxType: str(p.waxType) ?? null,
    burnTime: int(p.burnTime) ?? null,
    build: p.build ?? undefined,
    status: p.status ?? "active",
    isNew: !!p.isNew,
    isFeatured: !!p.isFeatured,
    rating: num(p.rating) ?? 0,
    reviewCount: int(p.reviewCount) ?? 0,
    sold: int(p.sold) ?? 0,
    createdAt: date(p.createdAt) ?? now,
    updatedAt: date(p.updatedAt) ?? now,
  }));
  const productRecipe = productList.flatMap((p) => recipeLines(p.id, p.recipe, "Sản phẩm").map((r) => ({ productId: p.id, ...r })));

  // ---- Khách, mã giảm giá
  const customerList: J[] = read(file, KEYS.customers) ?? [];
  const customers = customerList.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? "",
    phone: c.phone ?? "",
    hasAccount: !!c.hasAccount,
    newsletter: !!c.newsletter,
    tags: c.tags ?? [],
    note: str(c.note) ?? null,
    blocked: !!c.blocked,
    blockReason: str(c.blockReason) ?? null,
    createdAt: date(c.createdAt) ?? now,
  }));
  const customerIds = new Set(customers.map((c) => c.id));
  const discountList: J[] = read(file, KEYS.discounts) ?? [];
  const discounts = discountList.map((d) => ({
    id: d.id,
    code: d.code,
    description: str(d.description) ?? null,
    type: d.type,
    value: int(d.value) ?? 0,
    maxDiscount: int(d.maxDiscount) ?? null,
    minOrder: int(d.minOrder) ?? null,
    scope: d.scope ?? "all",
    firstOrderOnly: !!d.firstOrderOnly,
    startsAt: d.startsAt,
    endsAt: str(d.endsAt) ?? null,
    usageLimit: int(d.usageLimit) ?? null,
    perCustomerLimit: int(d.perCustomerLimit) ?? null,
    used: int(d.used) ?? 0,
    active: d.active !== false,
    createdAt: d.createdAt ?? now.toISOString().slice(0, 10),
  }));
  const discountCustomers = discountList.flatMap((d) =>
    ((d.customerIds ?? []) as string[]).flatMap((customerId) => {
      if (customerIds.has(customerId)) return [{ discountId: d.id, customerId }];
      warnings.push(`Mã ${d.code}: bỏ khách không còn (${customerId})`);
      return [];
    }),
  );

  // ---- Đơn hàng
  const orderList: J[] = read(file, KEYS.orders) ?? [];
  const orders = orderList.map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    customerName: o.customer?.name ?? "",
    customerEmail: o.customer?.email ?? "",
    customerPhone: o.customer?.phone ?? "",
    shippingAddress: o.shippingAddress ?? "",
    shippingMethod: o.shippingMethod ?? "",
    shippingName: str(o.shippingName) ?? null,
    shippingDays: int(o.shippingDays) ?? null,
    depositPercent: int(o.depositPercent) ?? null,
    subtotal: int(o.subtotal) ?? 0,
    discount: int(o.discount) ?? 0,
    discountCode: str(o.discountCode) ?? null,
    shippingFee: int(o.shippingFee) ?? 0,
    total: int(o.total) ?? 0,
    paymentPlan: o.paymentPlan ?? "full",
    paymentMethod: o.paymentMethod ?? "cod",
    readyDate: o.readyDate ?? "",
    note: str(o.note) ?? null,
    internalNote: str(o.internalNote) ?? null,
    cancelReason: str(o.cancelReason) ?? null,
    cancelOutcome: o.cancelOutcome ?? null,
    cancelFault: o.cancelFault ?? null,
    refundDue: int(o.refundDue) ?? null,
    refundAmount: int(o.refund?.amount) ?? null,
    refundImages: o.refund?.images ?? [],
    refundNote: str(o.refund?.note) ?? null,
    refundAt: date(o.refund?.at) ?? null,
    refundBy: str(o.refund?.by) ?? null,
    carrierId: str(o.carrier?.id) ?? null,
    carrierName: str(o.carrier?.name) ?? null,
    shipCarrierId: str(o.shipment?.carrierId) ?? null,
    shipCarrier: str(o.shipment?.carrier) ?? null,
    trackingCode: str(o.shipment?.trackingCode) ?? null,
    trackingUrl: str(o.shipment?.trackingUrl) ?? null,
    shipCost: int(o.shipment?.cost) ?? null,
    shippedAt: date(o.shipment?.at) ?? null,
    shippingCost: int(o.shippingCost) ?? null,
    deliveryAttempts: int(o.deliveryAttempts) ?? null,
    deliveryIssue: str(o.deliveryIssue) ?? null,
    returnCondition: o.returnCondition ?? null,
    returnNote: str(o.returnNote) ?? null,
    resendFee: int(o.resendFee) ?? null,
    materialCost: int(o.materialCost) ?? null,
    replacementForId: str(o.replacementFor?.id) ?? null,
    replacementForCode: str(o.replacementFor?.code) ?? null,
    createdAt: date(o.createdAt) ?? now,
    updatedAt: date(o.updatedAt) ?? now,
  }));
  const orderItems = orderList.flatMap((o) =>
    ((o.items ?? []) as J[]).map((i, k) => ({
      id: `${o.id}:${i.id}`,
      orderId: o.id,
      sortOrder: k,
      productId: str(i.productId) ?? null,
      name: i.name ?? "",
      image: str(i.image) ?? null,
      price: int(i.price) ?? 0,
      quantity: int(i.quantity) ?? 1,
      custom: str(i.custom) ?? null,
      craft: i.craft ?? undefined,
      recipe: i.recipe ?? undefined,
    })),
  );
  const payments = orderList.flatMap((o) =>
    ((o.payments ?? []) as J[]).map((p) => ({
      id: `${o.id}:${p.id}`,
      orderId: o.id,
      provider: p.provider ?? "cod",
      amount: int(p.amount) ?? 0,
      status: p.status ?? "pending",
      transactionId: str(p.transactionId) ?? null,
      isRefund: p.kind === "refund",
      images: p.images ?? [],
      note: str(p.note) ?? null,
      createdAt: date(p.createdAt) ?? now,
    })),
  );
  const events = orderList.flatMap((o) =>
    ((o.history ?? []) as J[]).map((e, k) => ({ orderId: o.id, sortOrder: k, at: date(e.at) ?? now, kind: e.kind ?? null, status: e.status, note: str(e.note) ?? null, by: e.by ?? "" })),
  );
  const complaints = orderList.flatMap((o) =>
    ((o.complaints ?? []) as J[]).map((c) => ({
      id: `${o.id}:${c.id}`,
      orderId: o.id,
      reason: c.reason ?? "",
      images: c.images ?? [],
      resolution: c.resolution ?? "none",
      refundAmount: int(c.refundAmount) ?? null,
      replacementId: str(c.replacementId) ?? null,
      replacementCode: str(c.replacementCode) ?? null,
      at: date(c.at) ?? now,
      by: c.by ?? "",
    })),
  );

  // ---- Sản phẩm hủy đơn
  const cancelled = ((read(file, KEYS.cancelled) ?? []) as J[]).map((c) => ({
    id: c.id,
    name: c.name,
    custom: str(c.custom) ?? null,
    recipe: c.recipe ?? undefined,
    personalized: !!c.personalized,
    images: c.images ?? [],
    price: int(c.price) ?? 0,
    quantity: int(c.quantity) ?? 1,
    orderId: c.orderId ?? "",
    orderCode: c.orderCode ?? "",
    customerName: c.customerName ?? "",
    cancelReason: c.cancelReason ?? "",
    cancelledAt: date(c.cancelledAt) ?? now,
    status: c.status ?? "pending",
    displayProductId: str(c.displayProductId) ?? null,
    updatedAt: date(c.updatedAt) ?? now,
  }));

  // ---- Thủ công, nháp, thông báo
  const craftSaved = read(file, KEYS.craft);
  const craftDraft = read(file, KEYS.craftDraft);
  const craft = [
    ...(craftSaved ? [{ id: "saved", config: craftSaved }] : []),
    ...(craftDraft ? [{ id: "draft", config: craftDraft, pendingMaterials: read(file, KEYS.craftPending) ?? [] }] : []),
  ];
  const draft = read(file, KEYS.orderDraft);
  const orderDraft = draft ? [{ id: "current", values: draft.values ?? {}, savedAt: date(draft.savedAt) ?? now }] : [];
  const notificationsRead = ((read(file, KEYS.notifications) ?? []) as string[]).map((id) => ({ id }));

  return {
    warnings,
    data: {
      settings,
      shippingOptions,
      carriers,
      categories,
      materials,
      materialRecipe,
      movements,
      products,
      productRecipe,
      customers,
      discounts,
      discountCustomers,
      orders,
      orderItems,
      payments,
      events,
      complaints,
      cancelled,
      craft,
      orderDraft,
      notificationsRead,
    },
  };
}

export type MappedBackup = ReturnType<typeof mapBackup>["data"];
