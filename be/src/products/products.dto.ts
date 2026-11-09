// Dữ liệu gửi lên cho Sản phẩm trưng bày (docs/pages/products.md). Giống drawer thêm / sửa của BO
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { RecipeLineDto } from '../materials/materials.dto.js';

export const AROMA = ['soft', 'medium', 'strong'] as const;
export const SIZES = ['small', 'medium', 'big'] as const;
export const STATUS = ['active', 'hidden'] as const;

export class ProductDto {
  // Bỏ trống thì lấy slug làm id. Sửa sản phẩm giữ id cũ dù đổi slug
  @IsOptional() @IsString() @MaxLength(80) id?: string;
  @IsString() @MinLength(1, { message: 'Nhập tên sản phẩm.' }) @MaxLength(120) name: string;
  // Bỏ trống thì tạo từ tên
  @IsOptional() @IsString() @MaxLength(80) slug?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsInt() @Min(1000, { message: 'Nhập giá bán.' }) price: number;
  @IsOptional() @IsInt() @Min(0) salePrice?: number;
  // Ảnh đầu tiên là ảnh chính: URL hoặc data URL (BO đang lưu ảnh dạng chuỗi)
  @ArrayMinSize(1, { message: 'Cần ít nhất 1 ảnh.' }) @ArrayMaxSize(10) @IsString({ each: true }) images: string[];
  @IsString() @MinLength(1, { message: 'Chọn danh mục.' }) categoryId: string;
  @IsIn(AROMA) aromaLevel: (typeof AROMA)[number];
  // Cỡ trên web, BO suy ra từ dung tích hũ
  @IsIn(SIZES) size: (typeof SIZES)[number];
  @IsOptional() @IsString() @MaxLength(120) scent?: string;
  @IsOptional() @IsString() @MaxLength(120) waxType?: string;
  @IsOptional() @IsInt() @Min(1) @Max(1000) burnTime?: number;
  // Công thức 1 cây (BO suy ra từ build): trừ Kho khi Bắt đầu làm
  @IsOptional() @ValidateNested({ each: true }) @Type(() => RecipeLineDto) recipe?: RecipeLineDto[];
  // Lựa chọn theo các bước Thủ công + phụ kiện khác ({ selection, extras }), lưu nguyên để mở lại form
  @IsOptional() @IsObject() build?: Record<string, unknown>;
  @IsIn(STATUS) status: (typeof STATUS)[number];
  @IsBoolean() isNew: boolean;
  @IsBoolean() isFeatured: boolean;
}

// Bật / tắt trên bảng và thao tác hàng loạt khi chọn nhiều
export class BulkPatchDto {
  @ArrayMinSize(1) @IsString({ each: true }) ids: string[];
  @IsOptional() @IsIn(STATUS) status?: (typeof STATUS)[number];
  @IsOptional() @IsBoolean() isNew?: boolean;
  @IsOptional() @IsBoolean() isFeatured?: boolean;
}

export class IdsDto {
  @ArrayMinSize(1) @IsString({ each: true }) ids: string[];
}
