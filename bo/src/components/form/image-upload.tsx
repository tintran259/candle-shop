import { DeleteOutlined, EyeOutlined, LoadingOutlined, PlusOutlined, StarFilled, StarOutlined } from "@ant-design/icons";
import { App, Button, Flex, Image, Tooltip, Upload } from "antd";
import { useEffect, useRef, useState } from "react";
import { compressImage, MAX_FILE_MB, MAX_IMAGES } from "@/lib/craft/image";
import { brand } from "@/theme";

// Cạnh ô ảnh — ô "Thêm ảnh" dùng cùng kích thước (xem .image-upload-trigger trong index.css)
const TILE = 112;

// Upload nhiều ảnh; ảnh đầu tiên là ảnh chính. Dùng như một field của antd Form.
export function ImageUpload({ value = [], onChange }: { value?: string[]; onChange?: (images: string[]) => void }) {
  const { message } = App.useApp();
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(0);
  // Chọn nhiều file thì beforeUpload chạy cho từng file — giữ danh sách mới nhất + số ảnh đang nén ở ref
  const latest = useRef(value);
  const pending = useRef(0);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  const beforeUpload = async (file: File) => {
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      message.warning(`${file.name} lớn hơn ${MAX_FILE_MB}MB, đã bỏ qua.`);
      return Upload.LIST_IGNORE;
    }
    if (latest.current.length + pending.current >= MAX_IMAGES) {
      message.warning(`Chỉ thêm được tối đa ${MAX_IMAGES} ảnh.`);
      return Upload.LIST_IGNORE;
    }
    pending.current += 1;
    setBusy(pending.current);
    try {
      const url = await compressImage(file);
      latest.current = [...latest.current, url];
      onChange?.(latest.current);
    } catch {
      message.error(`Không đọc được ${file.name}.`);
    } finally {
      pending.current -= 1;
      setBusy(pending.current);
    }
    return Upload.LIST_IGNORE;
  };

  const makeMain = (i: number) => onChange?.([value[i], ...value.filter((_, j) => j !== i)]);
  const remove = (i: number) => onChange?.(value.filter((_, j) => j !== i));

  // Tự vẽ từng ô ảnh: thanh nút luôn hiện bên dưới (không phụ thuộc hover, bấm được trên cảm ứng)
  return (
    <>
      <Flex wrap gap={12}>
        {value.map((src, i) => (
          <Flex key={`${i}-${src.slice(-16)}`} vertical gap={6} style={{ width: TILE }}>
            <button
              type="button"
              onClick={() => setPreview(src)}
              aria-label={`Xem ảnh ${i + 1}`}
              className="image-tile"
              style={{ width: TILE, height: TILE, outlineColor: i === 0 ? brand.ember : undefined }}
            >
              <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              {i === 0 && (
                <span
                  style={{
                    position: "absolute",
                    left: 6,
                    top: 6,
                    padding: "1px 8px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 500,
                    color: "#fff",
                    background: brand.ember,
                  }}
                >
                  Ảnh chính
                </span>
              )}
            </button>
            <Flex justify="space-between" style={{ background: "#f6f6f3", borderRadius: 10, padding: 2 }}>
              <Tooltip title={i === 0 ? "Đang là ảnh chính" : "Đặt làm ảnh chính"}>
                <Button
                  type="text"
                  size="small"
                  disabled={i === 0}
                  aria-label={i === 0 ? `Ảnh ${i + 1} đang là ảnh chính` : `Đặt ảnh ${i + 1} làm ảnh chính`}
                  icon={i === 0 ? <StarFilled style={{ color: brand.ember }} /> : <StarOutlined />}
                  onClick={() => makeMain(i)}
                />
              </Tooltip>
              <Tooltip title="Xem ảnh">
                <Button type="text" size="small" aria-label={`Xem ảnh ${i + 1}`} icon={<EyeOutlined />} onClick={() => setPreview(src)} />
              </Tooltip>
              <Tooltip title="Xóa ảnh">
                <Button type="text" size="small" danger aria-label={`Xóa ảnh ${i + 1}`} icon={<DeleteOutlined />} onClick={() => remove(i)} />
              </Tooltip>
            </Flex>
          </Flex>
        ))}

        {value.length + busy < MAX_IMAGES && (
          <Upload className="image-upload-trigger" listType="picture-card" accept="image/*" multiple showUploadList={false} beforeUpload={beforeUpload}>
            <button type="button" style={{ border: 0, background: "none", cursor: "pointer" }}>
              {busy ? <LoadingOutlined /> : <PlusOutlined />}
              <div style={{ marginTop: 8 }}>{busy ? "Đang xử lý…" : "Thêm ảnh"}</div>
            </button>
          </Upload>
        )}
      </Flex>
      {preview && (
        <Image
          src={preview}
          alt=""
          style={{ display: "none" }}
          preview={{ open: true, src: preview, onOpenChange: (open) => !open && setPreview(null) }}
        />
      )}
    </>
  );
}
