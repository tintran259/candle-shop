import { Type } from 'class-transformer';
import { ArrayMinSize, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';

export class ShippingOptionDto {
  @IsString() @MinLength(1) @MaxLength(60) id: string;
  @IsString() @MinLength(1, { message: 'Nhập tên phương thức.' }) @MaxLength(40) name: string;
  @IsInt() @Min(0) fee: number;
  @IsInt() @Min(0) @Max(60) days: number;
  @IsBoolean() enabled: boolean;
}

export class CarrierDto {
  @IsString() @MinLength(1) @MaxLength(60) id: string;
  @IsString() @MinLength(1, { message: 'Nhập tên đơn vị.' }) @MaxLength(40) name: string;
  @IsOptional() @IsString() @Matches(/^https?:\/\/\S*\{code\}\S*$/, { message: 'Link bắt đầu bằng http và có {code}.' }) trackingUrl?: string;
  @IsBoolean() requireCode: boolean;
  @IsBoolean() enabled: boolean;
}

export class SenderDto {
  @IsString() @MinLength(1, { message: 'Nhập tên shop.' }) @MaxLength(60) name: string;
  @IsString() @MaxLength(20) phone: string;
  @IsString() @MaxLength(200) address: string;
}

// Giống form Cài đặt của BO (docs/pages/settings.md)
export class SettingsDto {
  @IsInt() @Min(1) @Max(99) depositPercent: number;
  @IsInt() @Min(1) @Max(10) maxDeliveryAttempts: number;
  @IsInt() @Min(0) resendFee: number;
  @IsInt() @Min(0) @Max(1000) dailyCapacity: number;
  @IsInt() @Min(0) @Max(30) leadDays: number;
  @IsInt() @Min(0) @Max(95) minMargin: number;
  @IsNumber() @Min(1) @Max(20) priceMarkup: number;
  @ValidateNested() @Type(() => SenderDto) sender: SenderDto;
  @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ShippingOptionDto) shippingOptions: ShippingOptionDto[];
  @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => CarrierDto) carriers: CarrierDto[];
}
