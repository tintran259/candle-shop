// Dữ liệu gửi lên cho Đơn hàng (docs/pages/orders.md). Giống form Tạo đơn / Sửa đơn và các popup trong drawer đơn của BO
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsBoolean, IsEmail, IsIn, IsInt, IsObject, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { RecipeLineDto } from '../materials/materials.dto.js';

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const PHONE = /^[\d\s+.()-]{9,20}$/;
export const CHANNELS = { phone: 'Điện thoại', zalo: 'Zalo', facebook: 'Facebook', store: 'Tại cửa hàng', other: 'Khác' } as const;
export const STATUSES = ['pending', 'paid', 'producing', 'ready', 'shipping', 'completed', 'delivery_failed', 'returning', 'returned', 'cancelled'] as const;

export class CustomerDto {
  @IsString() @MinLength(1, { message: 'Nhập tên khách.' }) @MaxLength(60) name: string;
  @Matches(PHONE, { message: 'Số điện thoại chưa đúng.' }) phone: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail({}, { message: 'Email chưa đúng.' }) email?: string;
}

// Một dòng: nến có sẵn (productId) hoặc nến tự phối (mô tả, lựa chọn từng bước, công thức 1 hũ, giá BO tính theo Thủ công)
export class LineDto {
  @IsIn(['product', 'custom']) kind: 'product' | 'custom';
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() @MaxLength(120) name?: string;
  @IsOptional() @IsString() image?: string;
  @IsOptional() @IsString() @MaxLength(500) custom?: string;
  @IsOptional() @IsObject() craft?: Record<string, unknown>;
  @IsOptional() @ValidateNested({ each: true }) @Type(() => RecipeLineDto) recipe?: RecipeLineDto[];
  @IsInt() @Min(0) price: number;
  @IsInt() @Min(1) @Max(1000) quantity: number;
}

class OrderFields {
  @ValidateNested() @Type(() => CustomerDto) customer: CustomerDto;
  @IsString() @MinLength(1, { message: 'Nhập địa chỉ giao.' }) @MaxLength(300) shippingAddress: string;
  // Phí giao của đơn này (admin có thể sửa khác phí trong Cài đặt). Bỏ trống = phí của phương thức
  @IsOptional() @IsInt() @Min(0) shippingFee?: number;
  @IsOptional() @IsString() carrierId?: string;
  @Matches(DAY, { message: 'Ngày làm xong dạng YYYY-MM-DD.' }) readyDate: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
  @IsOptional() @IsString() @MaxLength(1000) internalNote?: string;
}

export class CreateOrderDto extends OrderFields {
  // Bỏ trống thì BE tự tạo. BO gửi id đã tạo sẵn để đơn đang mở giữ nguyên id
  @IsOptional() @Matches(/^ord-[a-z0-9-]{3,40}$/, { message: 'Mã đơn dạng ord-…' }) id?: string;
  @IsString() shippingMethod: string;
  @ArrayMinSize(1, { message: 'Thêm ít nhất một sản phẩm.' }) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => LineDto) lines: LineDto[];
  @IsOptional() @IsString() @MaxLength(40) discountCode?: string;
  @IsIn(['full', 'deposit']) paymentPlan: 'full' | 'deposit';
  @IsIn(['vnpay', 'momo', 'cod']) paymentMethod: 'vnpay' | 'momo' | 'cod';
  // Đã nhận tiền (cọc / đủ) lúc tạo đơn → đơn Đã thanh toán
  @IsBoolean() received: boolean;
  @IsOptional() @IsString() @MaxLength(100) transactionId?: string;
  @IsIn(Object.keys(CHANNELS)) channel: keyof typeof CHANNELS;
  // Khách đang bị chặn đặt hàng: phải xác nhận "Vẫn tạo đơn"
  @IsOptional() @IsBoolean() allowBlocked?: boolean;
}

export class EditOrderDto extends OrderFields {
  @IsOptional() @IsString() shippingMethod?: string;
  // Chỉ khi đơn còn Chờ thanh toán / Đã thanh toán. Bỏ trống = giữ sản phẩm và mã giảm giá
  @IsOptional() @ArrayMinSize(1) @ArrayMaxSize(50) @ValidateNested({ each: true }) @Type(() => LineDto) lines?: LineDto[];
  @IsOptional() @IsString() @MaxLength(40) discountCode?: string;
}

export class ShipDto {
  // Bỏ trống = đơn vị chọn lúc tạo đơn
  @IsOptional() @IsString() carrierId?: string;
  @IsOptional() @IsString() @MaxLength(60) trackingCode?: string;
  // Phí shop trả đơn vị vận chuyển cho lượt này
  @IsOptional() @IsInt() @Min(0) cost?: number;
}

export class ResendDto extends ShipDto {
  // Phí khách trả thêm, bỏ trống = phí gửi lại trong Cài đặt
  @IsOptional() @IsInt() @Min(0) fee?: number;
}

export class ReasonDto {
  @IsString() @MinLength(1, { message: 'Nhập lý do.' }) @MaxLength(500) reason: string;
}

export class ReturnDto {
  @IsIn(['good', 'damaged']) condition: 'good' | 'damaged';
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  // Phí hoàn hàng shop trả đơn vị vận chuyển
  @IsOptional() @IsInt() @Min(0) returnFee?: number;
}

export class ScheduleDto {
  @Matches(DAY, { message: 'Ngày làm xong dạng YYYY-MM-DD.' }) readyDate: string;
}

export class NoteDto {
  @IsString() @MaxLength(1000) internalNote: string;
}

export class CancelDto extends ReasonDto {
  @IsOptional() @IsIn(['returned', 'stocked', 'consumed']) outcome?: 'returned' | 'stocked' | 'consumed';
  @IsOptional() @IsIn(['customer', 'shop']) fault?: 'customer' | 'shop';
}

export class RefundDto {
  @IsInt() @Min(1) amount: number;
  @IsOptional() @ArrayMaxSize(10) @IsString({ each: true }) images?: string[];
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

class PickDto {
  @IsString() itemId: string;
  @IsInt() @Min(1) quantity: number;
}

export class ComplaintDto extends ReasonDto {
  @IsOptional() @ArrayMaxSize(10) @IsString({ each: true }) images?: string[];
  @IsIn(['resend', 'refund', 'none']) resolution: 'resend' | 'refund' | 'none';
  @IsOptional() @IsInt() @Min(1) refundAmount?: number;
  @IsOptional() @ArrayMaxSize(10) @IsString({ each: true }) refundImages?: string[];
  @IsOptional() @IsString() @MaxLength(500) refundNote?: string;
  // Gửi bù: các cây gửi lại và ngày làm xong của đơn gửi bù
  @IsOptional() @ValidateNested({ each: true }) @Type(() => PickDto) picks?: PickDto[];
  @IsOptional() @Matches(DAY) readyDate?: string;
}

export class OrderQuery {
  @IsOptional() @IsIn(STATUSES) status?: (typeof STATUSES)[number];
}
