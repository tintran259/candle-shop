// Kiểm tra dữ liệu các khối trang chủ (blocks.ts) — giới hạn ký tự; số dòng kiểm ở checkLines
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';
import { CARE_STEPS, EFFECTS } from './blocks.js';

// Ảnh: URL Cloudinary (https) hoặc data URL khi chưa cấu hình kho ảnh
export const IMAGE = /^(https:\/\/|data:image\/)/;
export const IMAGE_MAX = 3_000_000;

const Image = (label: string) => (target: object, key: string) => {
  IsOptional()(target, key);
  IsString()(target, key);
  Matches(IMAGE, { message: `Ảnh ${label} không hợp lệ.` })(target, key);
  MaxLength(IMAGE_MAX)(target, key);
};
const Text = (max: number, label: string) => (target: object, key: string) => {
  IsOptional()(target, key);
  IsString()(target, key);
  MaxLength(max, { message: `${label} tối đa ${max} ký tự.` })(target, key);
};

export class StoryDto {
  @IsOptional() @IsBoolean() hidden?: boolean;
  @Image('Câu chuyện') image?: string;
  @Text(60, 'Nhãn nhỏ Câu chuyện') eyebrow?: string;
  @Text(40, 'Dòng phụ Câu chuyện') kicker?: string;
  @Text(45, 'Tên khối Câu chuyện') title?: string;
  @Text(65, 'Câu dẫn Câu chuyện') heading?: string;
  @Text(900, 'Đoạn văn Câu chuyện') body?: string;
  @Text(40, 'Chữ liên kết Câu chuyện') cta?: string;
}

export class CareStepDto {
  @Text(40, 'Tên bước') title?: string;
  @Text(160, 'Mô tả bước') text?: string;
}

export class CareDto {
  @IsOptional() @IsBoolean() hidden?: boolean;
  @Image('Nghệ thuật đốt nến') image?: string;
  @Text(45, 'Tên khối Nghệ thuật đốt nến') title?: string;
  @Text(50, 'Liên kết nhỏ Nghệ thuật đốt nến') link?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(CARE_STEPS) @ValidateNested({ each: true }) @Type(() => CareStepDto) steps?: CareStepDto[];
}

export class ContactDto {
  @IsOptional() @IsBoolean() hidden?: boolean;
  @Image('Gửi lời nhắn') image?: string;
  @Text(45, 'Tên khối Gửi lời nhắn') title?: string;
  @Text(60, 'Câu dẫn Gửi lời nhắn') heading?: string;
  @Text(200, 'Mô tả Gửi lời nhắn') text?: string;
}

export class FooterDto {
  @Image('chân trang') image?: string;
  @Text(60, 'Khẩu hiệu chân trang') tagline?: string;
}

export class EffectDto {
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsIn(EFFECTS, { message: 'Hiệu ứng không hợp lệ.' }) kind?: (typeof EFFECTS)[number];
}
