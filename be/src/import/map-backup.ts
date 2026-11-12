// Chuyển file sao lưu của BO (Cài đặt › Sao lưu dữ liệu) thành dữ liệu cho từng bảng Prisma.
// Hàm thuần, không đụng DB — test được riêng. Ghi vào DB ở scripts/import-backup.ts.
// Dữ liệu tham chiếu tới mục đã xóa (vd công thức trỏ tới nguyên liệu không còn) được bỏ qua và ghi vào warnings.

import { date, int, num, str, type J } from './map-utils.js';
import { mapOrders } from './map-orders.js';

export type BackupFile = { app: string; version: number; exportedAt: string; data: Record<string, string> };

const KEYS = {
  settings: 'bo-settings-v1',
  categories: 'bo-categories-v1',
  concepts: 'bo-concepts-v1',
  siteTheme: 'bo-site-themes-v1',
  products: 'bo-products-v2',
  inventory: 'bo-inventory-v2',
  customers: 'bo-customers-v1',
  discounts: 'bo-discounts-v1',
  orders: 'bo-orders-v4',
  cancelled: 'bo-cancelled-products-v4',
  craft: 'bo-craft-builder-v5',
  craftDraft: 'bo-craft-builder-v5-draft',
  craftPending: 'bo-craft-builder-v5-new-materials',
  orderDraft: 'bo-order-draft-v1',
  notifications: 'bo-notifications-read-v1',
} as const;

const read = (file: BackupFile, key: string): J => {
  const raw = file.data[key];
  if (raw === undefined || raw === '') return undefined;
  return JSON.parse(raw);
};

export function mapBackup(file: BackupFile) {
  if (file?.app !== '2510-bo' || file.version !== 1 || !file.data) throw new Error('Không phải file sao lưu của 2510 Back Office.');
  const warnings: string[] = [];
  const now = new Date(file.exportedAt || Date.now());

  // ---- Cài đặt
  const s: J = read(file, KEYS.settings) ?? {};
  const settings = {
    id: 'shop',
    depositPercent: int(s.depositPercent) ?? 50,
    maxDeliveryAttempts: int(s.maxDeliveryAttempts) ?? 3,
    resendFee: int(s.resendFee) ?? 30000,
    dailyCapacity: int(s.dailyCapacity) ?? 20,
    leadDays: int(s.leadDays) ?? 3,
    minMargin: int(s.minMargin) ?? 50,
    priceMarkup: num(s.priceMarkup) ?? 2.5,
    senderName: s.sender?.name ?? '2510 Candle',
    senderPhone: s.sender?.phone ?? '',
    senderAddress: s.sender?.address ?? '',
  };
  const shippingOptions = ((s.shippingOptions ?? []) as J[]).map((o, i) => ({ id: o.id, name: o.name, fee: int(o.fee) ?? 0, days: int(o.days) ?? 0, enabled: o.enabled !== false, sortOrder: i }));
  const carriers = ((s.carriers ?? []) as J[]).map((c, i) => ({
    id: c.id,
    name: c.name,
    trackingUrl: str(c.trackingUrl) ?? null,
    requireCode: c.requireCode !== false,
    enabled: c.enabled !== false,
    sortOrder: i,
  }));
  // Mạng xã hội: bản sao lưu cũ không có thì rỗng
  const socials = ((s.socials ?? []) as J[]).map((x, i) => ({ id: x.id, platform: x.platform, label: str(x.label) ?? '', url: x.url, enabled: x.enabled !== false, sortOrder: i }));

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
  const materialRecipe = materialList.flatMap((m) =>
    recipeLines(m.id, m.recipe, 'Nguyên liệu').map((r) => ({ materialId: m.id, componentId: r.materialId, quantity: r.quantity, sortOrder: r.sortOrder })),
  );
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
        by: mv.by ?? '',
        at: date(mv.at) ?? now,
      },
    ];
  });

  // ---- Danh mục, sản phẩm
  const categoryList: J[] = read(file, KEYS.categories) ?? [];
  const categories = categoryList.map((c, i) => ({ id: c.id, nameVi: c.name?.vi ?? c.id, nameEn: c.name?.en ?? c.name?.vi ?? c.id, color: c.color ?? 'default', hidden: !!c.hidden, sortOrder: i }));
  const categoryIds = new Set(categories.map((c) => c.id));
  const productList: J[] = read(file, KEYS.products) ?? [];
  for (const p of productList)
    if (!categoryIds.has(p.categoryId)) {
      warnings.push(`Sản phẩm ${p.id}: danh mục ${p.categoryId} không còn — tạo danh mục cùng mã`);
      categories.push({ id: p.categoryId, nameVi: p.categoryId, nameEn: p.categoryId, color: 'default', hidden: false, sortOrder: categories.length });
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
    aromaLevel: p.aromaLevel ?? 'medium',
    size: p.size ?? 'medium',
    scent: str(p.scent) ?? null,
    waxType: str(p.waxType) ?? null,
    burnTime: int(p.burnTime) ?? null,
    build: p.build ?? undefined,
    status: p.status ?? 'active',
    isNew: !!p.isNew,
    isFeatured: !!p.isFeatured,
    rating: num(p.rating) ?? 0,
    reviewCount: int(p.reviewCount) ?? 0,
    sold: int(p.sold) ?? 0,
    createdAt: date(p.createdAt) ?? now,
    updatedAt: date(p.updatedAt) ?? now,
  }));
  const productRecipe = productList.flatMap((p) => recipeLines(p.id, p.recipe, 'Sản phẩm').map((r) => ({ productId: p.id, ...r })));

  // ---- Giao diện web (danh sách: Mặc định + giao diện theo concept, mỗi cái có bản đã đăng / nháp)
  const themeList: J[] = read(file, KEYS.siteTheme) ?? [];
  const siteTheme = themeList.map((t, i) => ({
    id: t.id,
    name: t.name || 'Giao diện',
    published: t.published ?? undefined,
    draft: t.draft ?? undefined,
    publishedAt: date(t.publishedAt) ?? null,
    createdAt: new Date(now.getTime() + i),
  }));

  // ---- Concept (dịp lễ) + thời gian + liên kết với sản phẩm. Bản sao lưu cũ chưa có concept thì bỏ qua
  const day = (v: unknown) => (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00.000Z`) : null);
  const conceptList: J[] = read(file, KEYS.concepts) ?? [];
  const concepts = conceptList.map((c, i) => ({
    id: c.id,
    nameVi: c.name?.vi ?? c.id,
    nameEn: c.name?.en || c.name?.vi || c.id,
    color: c.color ?? 'default',
    hidden: !!c.hidden,
    startsOn: day(c.startsOn),
    endsOn: day(c.endsOn),
    sortOrder: i,
  }));
  const conceptIds = new Set(concepts.map((c) => c.id));
  const productConcepts = productList.flatMap((p) =>
    [...new Set<string>(p.conceptIds ?? [])].flatMap((conceptId) => {
      if (conceptIds.has(conceptId)) return [{ productId: p.id as string, conceptId }];
      warnings.push(`Sản phẩm ${p.id}: concept ${conceptId} không còn — bỏ qua`);
      return [];
    }),
  );

  // ---- Khách, mã giảm giá
  const customerList: J[] = read(file, KEYS.customers) ?? [];
  const customers = customerList.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email ?? '',
    phone: c.phone ?? '',
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
    scope: d.scope ?? 'all',
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

  // ---- Đơn hàng (map-orders.ts)
  const { orders, orderItems, payments, events, complaints } = mapOrders(read(file, KEYS.orders) ?? [], now);

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
    orderId: c.orderId ?? '',
    orderCode: c.orderCode ?? '',
    customerName: c.customerName ?? '',
    cancelReason: c.cancelReason ?? '',
    cancelledAt: date(c.cancelledAt) ?? now,
    status: c.status ?? 'pending',
    displayProductId: str(c.displayProductId) ?? null,
    updatedAt: date(c.updatedAt) ?? now,
  }));

  // ---- Thủ công, nháp, thông báo
  const craftSaved = read(file, KEYS.craft);
  const craftDraft = read(file, KEYS.craftDraft);
  const craft = [...(craftSaved ? [{ id: 'saved', config: craftSaved }] : []), ...(craftDraft ? [{ id: 'draft', config: craftDraft, pendingMaterials: read(file, KEYS.craftPending) ?? [] }] : [])];
  const draft = read(file, KEYS.orderDraft);
  const orderDraft = draft ? [{ id: 'current', values: draft.values ?? {}, savedAt: date(draft.savedAt) ?? now }] : [];
  const notificationsRead = ((read(file, KEYS.notifications) ?? []) as string[]).map((id) => ({ id }));

  return {
    warnings,
    data: {
      settings,
      shippingOptions,
      carriers,
      socials,
      categories,
      materials,
      materialRecipe,
      movements,
      products,
      productRecipe,
      concepts,
      productConcepts,
      siteTheme,
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

export type MappedBackup = ReturnType<typeof mapBackup>['data'];
