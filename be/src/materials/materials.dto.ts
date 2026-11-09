// Dữ liệu gửi lên cho Kho nguyên liệu (docs/pages/inventory.md). Giống form drawer nguyên liệu của BO
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from 'class-validator';

export const CATEGORIES = ['vessel', 'wax', 'fragrance', 'wick', 'dye', 'decor', 'packaging', 'other'] as const;
export const UNITS = ['g', 'ml', 'pcs'] as const;
export const MOVEMENT_TYPES = ['in', 'out', 'adjust', 'order', 'cost', 'make'] as const;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export class RecipeLineDto {
  @IsString() @MinLength(1) materialId: string;
  @IsNumber() @Min(0.01) @Max(1_000_000) quantity: number;
}

class MaterialFields {
  @IsOptional() @IsString() @MaxLength(30) sku?: string;
  @IsOptional() @IsString() @MaxLength(60) jarType?: string;
  // null = bỏ dung tích
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(1) @Max(100_000) capacity?: number | null;
  // Giá nhập bình quân: chỉ sửa thẳng được khi không theo dõi tồn (theo dõi tồn thì đổi qua phiếu nhập / Sửa giá). null = chưa có giá
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() @Min(0) unitCost?: number | null;
  // Xưởng tự sản xuất: định mức cho 1 đơn vị. [] = nguyên liệu mua về
  @IsOptional() @ValidateNested({ each: true }) @Type(() => RecipeLineDto) recipe?: RecipeLineDto[];
  @IsOptional() @IsString() @MaxLength(30) swatch?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class CreateMaterialDto extends MaterialFields {
  // Bỏ trống thì tạo từ tên: "Sáp đậu nành" → "sap-dau-nanh"
  @IsOptional() @IsString() @MaxLength(60) id?: string;
  @IsString() @MinLength(1, { message: 'Nhập tên nguyên liệu.' }) @MaxLength(80) name: string;
  @IsIn(CATEGORIES) category: (typeof CATEGORIES)[number];
  @IsIn(UNITS) unit: (typeof UNITS)[number];
  @IsBoolean() tracked: boolean;
  // Tồn ban đầu — ghi thành phiếu "Tồn ban đầu"
  @IsOptional() @IsNumber() @Min(0) stock?: number;
  // Tổng tiền đã trả cho tồn ban đầu (0 = không mất tiền) → chia ra giá nhập ban đầu
  @IsOptional() @IsInt() @Min(0) openingTotal?: number;
  @IsOptional() @IsNumber() @Min(0) lowStock?: number;
}

export class UpdateMaterialDto extends MaterialFields {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(80) name?: string;
  @IsOptional() @IsIn(CATEGORIES) category?: (typeof CATEGORIES)[number];
  @IsOptional() @IsIn(UNITS) unit?: (typeof UNITS)[number];
  @IsOptional() @IsBoolean() tracked?: boolean;
  @IsOptional() @IsNumber() @Min(0) lowStock?: number;
}

export class CreateManyDto {
  @ValidateNested({ each: true }) @Type(() => CreateMaterialDto) materials: CreateMaterialDto[];
}

// Phiếu ghi tay: in = nhập thêm, out = xuất / hao hụt, adjust = kiểm kê (amount là số đếm thực tế)
export class MovementDto {
  @IsIn(['in', 'out', 'adjust']) type: 'in' | 'out' | 'adjust';
  @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsString() @MaxLength(200) note?: string;
  // Phiếu nhập: tổng tiền lô, 0 = không mất tiền. Bắt buộc với "in"
  @IsOptional() @IsInt() @Min(0) lotTotal?: number;
}

export class CostDto {
  @IsNumber() @Min(0) unitCost: number;
}

export class ProduceDto {
  @IsInt() @Min(1, { message: 'Nhập số lượng sản xuất lớn hơn 0.' }) @Max(100_000) count: number;
  // Tự nhập tổng chi phí cả mẻ. Bỏ trống = theo giá nguyên liệu
  @IsOptional() @IsInt() @Min(0) total?: number;
  @IsOptional() @IsString() @MaxLength(200) note?: string;
}

export class MovementQuery {
  @IsOptional() @IsIn(MOVEMENT_TYPES) type?: (typeof MOVEMENT_TYPES)[number];
  @IsOptional() @IsString() materialId?: string;
  @IsOptional() @Matches(DAY) from?: string;
  @IsOptional() @Matches(DAY) to?: string;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5000) limit?: number;
}
