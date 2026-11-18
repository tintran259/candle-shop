// Gọi Admin API / Search API của Cloudinary (khóa bí mật chỉ ở BE). Dùng cho trang BO › Cài đặt › Kho ảnh (docs/pages/media.md)
import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';

export const ROOT = 'candle2510';

// Một ảnh trên Cloudinary (chỉ các trường trang Kho ảnh dùng)
export type CloudImage = {
  public_id: string;
  asset_folder?: string;
  folder?: string;
  format: string;
  bytes: number;
  width: number;
  height: number;
  created_at: string;
  secure_url: string;
};

function env() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new ServiceUnavailableException('Chưa cấu hình kho ảnh (Cloudinary).');
  return { base: `https://api.cloudinary.com/v1_1/${cloud}`, auth: `Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}` };
}

// json: gửi body dạng JSON
async function call<T>(url: string, method: 'POST' | 'DELETE', json?: object): Promise<T> {
  const { auth } = env();
  const res = await fetch(url, { method, headers: { Authorization: auth, ...(json && { 'Content-Type': 'application/json' }) }, body: json && JSON.stringify(json) });
  const data = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) throw new BadGatewayException(`Không đọc được kho ảnh${data.error?.message ? `: ${data.error.message}` : ''}.`);
  return data;
}

// Mọi ảnh trong thư mục candle2510/ (mới nhất trước). Search API lọc theo thư mục — chạy được cả tài khoản thư mục cố định lẫn thư mục động.
// Mỗi lượt tối đa 500 ảnh, tối đa 20 lượt (10.000 ảnh)
export async function listImages(): Promise<CloudImage[]> {
  const { base } = env();
  const out: CloudImage[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 20; page++) {
    const body = { expression: `resource_type:image AND folder:${ROOT}/*`, max_results: 500, sort_by: [{ created_at: 'desc' }], ...(cursor && { next_cursor: cursor }) };
    const data = await call<{ resources: CloudImage[]; next_cursor?: string }>(`${base}/resources/search`, 'POST', body);
    out.push(...data.resources);
    cursor = data.next_cursor;
    if (!cursor) break;
  }
  return out;
}

// Xóa ảnh (tối đa 100 mỗi lần gọi). Trả các public_id Cloudinary báo đã xóa
export async function destroyImages(publicIds: string[]): Promise<string[]> {
  const { base } = env();
  const deleted: string[] = [];
  for (let i = 0; i < publicIds.length; i += 100) {
    const qs = publicIds
      .slice(i, i + 100)
      .map((id) => `public_ids[]=${encodeURIComponent(id)}`)
      .join('&');
    const data = await call<{ deleted: Record<string, string> }>(`${base}/resources/image/upload?${qs}`, 'DELETE');
    deleted.push(...Object.entries(data.deleted ?? {}).flatMap(([id, s]) => (s === 'deleted' || s === 'not_found' ? [id] : [])));
  }
  return deleted;
}
