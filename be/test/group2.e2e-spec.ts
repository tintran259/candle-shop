// API nhóm 2: Kho nguyên liệu, phiếu kho, sản xuất, sản phẩm — chạy trên DB thật, schema bo_test
import { createTestApp, resetDb } from './app.js';

type T = Awaited<ReturnType<typeof createTestApp>>;
let t: T;

beforeAll(async () => {
  t = await createTestApp();
});
beforeEach(async () => {
  await resetDb(t.prisma);
});
afterAll(async () => {
  await t.app.close();
});

const wax = (over: object = {}) => ({ name: 'Sáp đậu nành', category: 'wax', unit: 'g', tracked: true, stock: 5000, openingTotal: 300000, lowStock: 500, ...over });

describe('Kho nguyên liệu', () => {
  it('tạo có tồn ban đầu: id từ tên, giá ban đầu, phiếu "Tồn ban đầu" ghi người ghi', async () => {
    const r = await t.post('/api/admin/materials', wax()).expect(201);
    expect(r.body).toMatchObject({ id: 'sap-dau-nanh', stock: 5000, unitCost: 60, tracked: true });
    const mv = await t.get('/api/admin/stock-movements?materialId=sap-dau-nanh').expect(200);
    expect(mv.body).toEqual([expect.objectContaining({ type: 'in', change: 5000, after: 5000, note: 'Tồn ban đầu', totalCost: 300000, unitCost: 60, by: 'Admin 2510' })]);
    await t.post('/api/admin/materials', wax({ id: 'sap-dau-nanh' })).expect(409);
    await t.post('/api/admin/materials', wax({ name: 'Sáp đậu nành', stock: 0 })).expect(400); // có tiền mà tồn 0
  });

  it('giá bình quân theo ví dụ trong docs: 60 → 70 → 78,33', async () => {
    await t.post('/api/admin/materials', wax({ id: 'soy' })).expect(201);
    const a = await t.post('/api/admin/materials/soy/movements', { type: 'in', amount: 5000, lotTotal: 400000 }).expect(201);
    expect(a.body.material).toMatchObject({ stock: 10000, unitCost: 70 });
    expect(a.body.movement).toMatchObject({ type: 'in', change: 5000, totalCost: 400000, unitCost: 80 });
    const b = await t.post('/api/admin/materials/soy/movements', { type: 'out', amount: 9000, note: 'Làm nến' }).expect(201);
    expect(b.body.material).toMatchObject({ stock: 1000, unitCost: 70 });
    const c = await t.post('/api/admin/materials/soy/movements', { type: 'in', amount: 5000, lotTotal: 400000 }).expect(201);
    expect(c.body.material).toMatchObject({ stock: 6000, unitCost: 78.33 });
    const d = await t.post('/api/admin/materials/soy/movements', { type: 'adjust', amount: 5800 }).expect(201);
    expect(d.body.movement).toMatchObject({ type: 'adjust', change: -200, after: 5800 });
  });

  it('chặn phiếu: nhập thiếu tiền lô, xuất quá tồn, số 0, nguyên liệu không theo dõi tồn', async () => {
    await t.post('/api/admin/materials', wax({ id: 'soy' })).expect(201);
    await t.post('/api/admin/materials', { id: 'none', name: 'Không mùi', category: 'fragrance', unit: 'ml', tracked: false, unitCost: 0 }).expect(201);
    expect((await t.post('/api/admin/materials/soy/movements', { type: 'in', amount: 100 }).expect(400)).body.message).toContain('tổng tiền');
    expect((await t.post('/api/admin/materials/soy/movements', { type: 'out', amount: 6000 }).expect(400)).body.message).toContain('còn 5.000 g');
    await t.post('/api/admin/materials/soy/movements', { type: 'out', amount: 0 }).expect(400);
    await t.post('/api/admin/materials/none/movements', { type: 'in', amount: 1, lotTotal: 0 }).expect(400);
    await t.post('/api/admin/materials/khong-co/movements', { type: 'out', amount: 1 }).expect(404);
  });

  it('sửa giá ghi phiếu giá mới / giá trước; không đổi thì không ghi. Sửa thông tin không đổi tồn, không đổi giá', async () => {
    await t.post('/api/admin/materials', wax({ id: 'soy' })).expect(201);
    const r = await t.put('/api/admin/materials/soy/cost', { unitCost: 59.8 }).expect(200);
    expect(r.body.movement).toMatchObject({ type: 'cost', change: 0, after: 5000, unitCost: 59.8, previousCost: 60 });
    expect((await t.put('/api/admin/materials/soy/cost', { unitCost: 59.8 }).expect(200)).body.movement).toBeNull();
    await t.patch('/api/admin/materials/soy', { unitCost: 10 }).expect(400);
    const e = await t.patch('/api/admin/materials/soy', { name: 'Sáp đậu nành Mỹ', lowStock: 800, sku: 'SOY-01' }).expect(200);
    expect(e.body).toMatchObject({ name: 'Sáp đậu nành Mỹ', stock: 5000, unitCost: 59.8, lowStock: 800, sku: 'SOY-01' });
  });

  it('sản xuất: trừ từng nguyên liệu, cộng thành phẩm, chung mã mẻ, giá theo nguyên liệu; mẻ sau gộp giá bình quân', async () => {
    await t.post('/api/admin/materials', { id: 'plaster', name: 'Thạch cao', category: 'other', unit: 'g', tracked: true, stock: 19000, openingTotal: 760000 }).expect(201); // 40 ₫/g
    await t.post('/api/admin/materials', { id: 'dye', name: 'Màu thạch cao', category: 'dye', unit: 'ml', tracked: true, stock: 100, openingTotal: 20000 }).expect(201); // 200 ₫/ml
    const jar = {
      id: 'jar-150',
      name: 'Hũ gốm 150ml',
      category: 'vessel',
      jarType: 'Hũ gốm',
      capacity: 150,
      unit: 'pcs',
      tracked: false,
      recipe: [
        { materialId: 'plaster', quantity: 350 },
        { materialId: 'dye', quantity: 2 },
      ],
    };
    expect((await t.post('/api/admin/materials', { ...jar, stock: 5 }).expect(400)).body.message).toContain('phiếu Sản xuất');
    const made = await t.post('/api/admin/materials', jar).expect(201);
    expect(made.body).toMatchObject({ tracked: true, stock: 0, recipe: jar.recipe });
    const r = await t.post('/api/admin/materials/jar-150/produce', { count: 20, note: 'Mẻ đầu tiên' }).expect(201);
    // 7.000 g × 40 + 40 ml × 200 = 288.000 ₫ → 14.400 ₫/hũ
    expect(r.body.material).toMatchObject({ stock: 20, unitCost: 14400 });
    expect(r.body.movements).toHaveLength(3);
    expect(r.body.movements[0]).toMatchObject({ materialId: 'jar-150', change: 20, totalCost: 288000, unitCost: 14400, note: 'Mẻ đầu tiên', batch: r.body.batch });
    expect(
      r.body.movements
        .slice(1)
        .map((m: { materialId: string; change: number; note: string }) => [m.materialId, m.change, m.note])
        .sort(),
    ).toEqual([
      ['dye', -40, 'Làm Hũ gốm 150ml · 20 cái'],
      ['plaster', -7000, 'Làm Hũ gốm 150ml · 20 cái'],
    ]);
    expect((await t.get('/api/admin/materials/plaster').expect(200)).body.stock).toBe(12000);
    // Mẻ sau tự nhập tổng chi phí: 10 hũ 200.000 ₫ = 20.000 ₫/hũ → bình quân (20 × 14.400 + 10 × 20.000) ÷ 30
    const r2 = await t.post('/api/admin/materials/jar-150/produce', { count: 10, total: 200000 }).expect(201);
    expect(r2.body.material).toMatchObject({ stock: 30, unitCost: 16266.67 });
    expect((await t.post('/api/admin/materials/jar-150/produce', { count: 100 }).expect(400)).body.message).toContain(
      'Không đủ Thạch cao (cần 35.000 g, còn 8.500), Màu thạch cao (cần 200 ml, còn 40).',
    );
    await t.post('/api/admin/materials/plaster/produce', { count: 1 }).expect(400); // không có công thức
  });

  it('sản xuất chặn khi nguyên liệu chưa có giá (trừ khi tự nhập giá); công thức không dùng chính nó, không vòng', async () => {
    await t.post('/api/admin/materials/batch', { materials: [{ id: 'plaster', name: 'Thạch cao', category: 'other', unit: 'g', tracked: true, stock: 1000 }] }).expect(201);
    await t.post('/api/admin/materials', { id: 'jar', name: 'Hũ', category: 'vessel', unit: 'pcs', tracked: true, recipe: [{ materialId: 'plaster', quantity: 100 }] }).expect(201);
    expect((await t.post('/api/admin/materials/jar/produce', { count: 2 }).expect(400)).body.message).toContain('chưa có giá nhập');
    expect((await t.post('/api/admin/materials/jar/produce', { count: 2, total: 0 }).expect(201)).body.material.unitCost).toBe(0);
    await t.patch('/api/admin/materials/jar', { recipe: [{ materialId: 'jar', quantity: 1 }] }).expect(400);
    await t.patch('/api/admin/materials/plaster', { recipe: [{ materialId: 'jar', quantity: 1 }] }).expect(400);
    await t.patch('/api/admin/materials/jar', { tracked: false }).expect(400);
    // Tạo nhiều: id đã có thì bỏ qua
    const many = await t
      .post('/api/admin/materials/batch', {
        materials: [
          { id: 'plaster', name: 'X', category: 'other', unit: 'g', tracked: true },
          { id: 'wick', name: 'Bấc', category: 'wick', unit: 'pcs', tracked: true, stock: 50 },
        ],
      })
      .expect(201);
    expect(many.body.map((m: { id: string }) => m.id)).toEqual(['wick']);
  });

  it('xóa: chặn khi nằm trong công thức sản phẩm / sản xuất; xóa được thì mất cả lịch sử phiếu', async () => {
    await t.post('/api/admin/categories', { id: 'fruit', name: { vi: 'Trái cây', en: '' } }).expect(201);
    await t.post('/api/admin/materials', wax({ id: 'soy' })).expect(201);
    await t
      .post('/api/admin/products', {
        name: 'Nến cam',
        price: 250000,
        images: ['a.jpg'],
        categoryId: 'fruit',
        aromaLevel: 'soft',
        size: 'small',
        status: 'active',
        isNew: true,
        isFeatured: false,
        recipe: [{ materialId: 'soy', quantity: 120 }],
      })
      .expect(201);
    expect((await t.del('/api/admin/materials/soy').expect(409)).body.message).toContain('Nến cam');
    await t.post('/api/admin/products/delete', { ids: ['nen-cam'] }).expect(200);
    await t.del('/api/admin/materials/soy').expect(204);
    expect((await t.get('/api/admin/stock-movements').expect(200)).body).toEqual([]);
  });

  it('lọc phiếu kho theo loại, ngày, tìm không dấu', async () => {
    await t.post('/api/admin/materials', wax({ id: 'soy' })).expect(201);
    await t.post('/api/admin/materials/soy/movements', { type: 'out', amount: 100, note: 'Đổ thử mẫu mới' }).expect(201);
    expect((await t.get('/api/admin/stock-movements?type=out').expect(200)).body).toHaveLength(1);
    expect((await t.get('/api/admin/stock-movements?q=do thu').expect(200)).body[0].note).toBe('Đổ thử mẫu mới');
    expect((await t.get('/api/admin/stock-movements?q=dau nanh').expect(200)).body).toHaveLength(2);
    expect((await t.get('/api/admin/stock-movements?to=2020-01-01').expect(200)).body).toEqual([]);
    expect((await t.get('/api/admin/stock-movements?limit=1').expect(200)).body[0].type).toBe('out');
    await t.get('/api/admin/stock-movements?type=xyz').expect(400);
  });
});

describe('Sản phẩm', () => {
  const product = (over: object = {}) => ({
    name: 'Nến Cam Quế',
    description: 'Hương cam ấm',
    price: 250000,
    images: ['data:image/webp;base64,AAAA'],
    categoryId: 'fruit',
    aromaLevel: 'medium',
    size: 'small',
    waxType: 'Sáp đậu nành',
    burnTime: 25,
    recipe: [{ materialId: 'soy', quantity: 120 }],
    build: { selection: { vessel: { optionId: 'gom' } }, extras: [] },
    status: 'active',
    isNew: true,
    isFeatured: false,
    ...over,
  });
  beforeEach(async () => {
    await t.post('/api/admin/categories', { id: 'fruit', name: { vi: 'Trái cây', en: '' } }).expect(201);
    await t.post('/api/admin/materials', wax({ id: 'soy' })).expect(201);
  });

  it('tạo (id = slug từ tên), chặn slug trùng, giá giảm ≥ giá bán, danh mục / nguyên liệu không có', async () => {
    const r = await t.post('/api/admin/products', product()).expect(201);
    expect(r.body).toMatchObject({ id: 'nen-cam-que', slug: 'nen-cam-que', price: 250000, recipe: [{ materialId: 'soy', quantity: 120 }], build: product().build, sold: 0, rating: 0 });
    expect(r.body.salePrice).toBeUndefined();
    expect((await t.post('/api/admin/products', product({ name: 'Khác', slug: 'Nến cam quế' })).expect(409)).body.message).toContain('Nến Cam Quế');
    await t.post('/api/admin/products', product({ name: 'B', salePrice: 250000 })).expect(400);
    await t.post('/api/admin/products', product({ name: 'C', categoryId: 'khong-co' })).expect(400);
    await t.post('/api/admin/products', product({ name: 'D', recipe: [{ materialId: 'khong-co', quantity: 1 }] })).expect(400);
    await t.post('/api/admin/products', product({ name: 'E', images: [] })).expect(400);
  });

  it('sửa giữ id, số đã bán; đổi slug; bỏ công thức. Bật tắt hàng loạt, xóa hàng loạt', async () => {
    await t.post('/api/admin/products', product()).expect(201);
    await t.post('/api/admin/products', product({ name: 'Nến Oải Hương' })).expect(201);
    await t.prisma.product.update({ where: { id: 'nen-cam-que' }, data: { sold: 7 } });
    const e = await t.put('/api/admin/products/nen-cam-que', product({ name: 'Nến Cam', slug: '', salePrice: 199000, recipe: [], build: undefined })).expect(200);
    expect(e.body).toMatchObject({ id: 'nen-cam-que', slug: 'nen-cam', salePrice: 199000, sold: 7 });
    expect(e.body.recipe).toBeUndefined();
    expect(e.body.build).toBeUndefined();
    const p = await t.patch('/api/admin/products', { ids: ['nen-cam-que', 'nen-oai-huong'], status: 'hidden', isFeatured: true }).expect(200);
    expect(p.body.map((x: { status: string; isFeatured: boolean }) => [x.status, x.isFeatured])).toEqual([
      ['hidden', true],
      ['hidden', true],
    ]);
    expect((await t.post('/api/admin/products/delete', { ids: ['nen-cam-que', 'nen-oai-huong'] }).expect(200)).body).toEqual({ deleted: 2 });
    await t.post('/api/admin/products/delete', { ids: ['nen-cam-que'] }).expect(404);
    await t.put('/api/admin/products/nen-cam-que', product()).expect(404);
  });
});
