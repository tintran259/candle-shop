import { DeleteOutlined, LoadingOutlined, UploadOutlined } from "@ant-design/icons";
import { App, Button, Flex, Typography, Upload } from "antd";
import { useState } from "react";
import { imageUrl, MAX_FILE_MB, prepareImage } from "@/lib/craft/image";

type Props = {
  value?: string;
  onChange?: (v: string | undefined) => void;
  // Cạnh dài tối đa khi nén; chiều ngang tối thiểu khuyên dùng (nhỏ hơn thì cảnh báo, vẫn cho chọn)
  maxSide: number;
  minWidth: number;
  // Nền khung xem trước: tối (logo sáng, hero) / kem (logo tối)
  backdrop?: "dark" | "light";
  height?: number;
  // Chữ khi trống (vd "Đang dùng ảnh mặc định của web")
  emptyText: string;
  label: string;
  // Ảnh đang dùng khi để trống (ảnh của Mặc định / ảnh có sẵn của web) — hiện mờ thay cho khung trống. tint: tô logo mặt nạ theo màu
  fallback?: { src: string; tint?: string };
};

// Chọn MỘT ảnh (hero, logo). Chỉ nén + xem trước trên máy; trang gọi uploadImages() khi bấm Lưu. SVG giữ nguyên (không nén)
export function SingleImage({ value, onChange, maxSide, minWidth, backdrop = "dark", height = 140, emptyText, label, fallback }: Props) {
  const { message } = App.useApp();
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    if (!file.type.startsWith("image/")) return (message.error("Chỉ chọn file ảnh."), false);
    if (file.size > MAX_FILE_MB * 1024 * 1024) return (message.error(`Ảnh lớn hơn ${MAX_FILE_MB} MB.`), false);
    setBusy(true);
    try {
      if (file.type === "image/svg+xml") {
        onChange?.(
          await new Promise<string>((ok, fail) => Object.assign(new FileReader(), { onload: (e: ProgressEvent<FileReader>) => ok(String(e.target?.result)), onerror: fail }).readAsDataURL(file)),
        );
      } else {
        const bitmap = await createImageBitmap(file);
        if (bitmap.width < minWidth) message.warning(`Ảnh rộng ${bitmap.width}px — nên dùng ảnh rộng từ ${minWidth}px để không bị mờ.`);
        bitmap.close();
        onChange?.(await prepareImage(file, maxSide));
      }
    } catch {
      message.error("Không đọc được ảnh này.");
    } finally {
      setBusy(false);
    }
    return false;
  };

  const bg = backdrop === "dark" ? "#282720" : "#f5f2e9";
  return (
    <Flex gap={12} align="flex-start" wrap>
      <div
        aria-label={label}
        role="img"
        style={{ width: 220, height, borderRadius: 8, background: bg, border: "1px solid #e5e2da", overflow: "hidden", display: "grid", placeItems: "center", flexShrink: 0 }}
      >
        {value ? (
          <img
            src={imageUrl(value, 220, false)}
            alt=""
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: backdrop === "dark" && height > 100 ? "cover" : "contain",
              width: height > 100 ? "100%" : undefined,
              height: height > 100 ? "100%" : undefined,
            }}
          />
        ) : fallback ? (
          <div style={{ position: "relative", width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
            {fallback.tint ? (
              <span
                style={{
                  width: "70%",
                  aspectRatio: "1600 / 374",
                  background: fallback.tint,
                  WebkitMaskImage: `url(${fallback.src})`,
                  maskImage: `url(${fallback.src})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                }}
              />
            ) : (
              <img src={imageUrl(fallback.src, 220, false)} alt="" style={{ width: "100%", height: "100%", objectFit: height > 100 ? "cover" : "contain", padding: height > 100 ? 0 : 12 }} />
            )}
            <span style={{ position: "absolute", left: 6, bottom: 6, background: "rgb(0 0 0 / 0.55)", color: "#fff", fontSize: 11, padding: "1px 6px", borderRadius: 4 }}>{emptyText}</span>
          </div>
        ) : (
          <Typography.Text style={{ color: backdrop === "dark" ? "#c9c3b4" : "#6b6b6b", fontSize: 12, padding: 12, textAlign: "center" }}>{emptyText}</Typography.Text>
        )}
      </div>
      <Flex vertical gap={8}>
        <Upload accept="image/*" showUploadList={false} beforeUpload={pick}>
          <Button icon={busy ? <LoadingOutlined /> : <UploadOutlined />} disabled={busy} aria-label={`Chọn ảnh: ${label}`}>
            {value ? "Đổi ảnh" : "Chọn ảnh"}
          </Button>
        </Upload>
        {value && (
          <Button type="text" danger icon={<DeleteOutlined />} onClick={() => onChange?.(undefined)} aria-label={`Bỏ ảnh: ${label}`}>
            Bỏ ảnh
          </Button>
        )}
      </Flex>
    </Flex>
  );
}
