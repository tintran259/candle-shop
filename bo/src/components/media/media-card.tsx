import { Checkbox, Image, Tag, Typography } from "antd";
import { Tooltip } from "@/components/tooltip";
import { imageUrl } from "@/lib/craft/image";
import { formatBytes, type MediaImage } from "@/lib/media";

// Một ảnh trong Kho ảnh: ảnh thu nhỏ (bấm xem ảnh gốc), tên, cỡ / dung lượng / ngày tải, nơi đang dùng.
// Ảnh không dùng có ô chọn để xóa; ảnh đang dùng thì không chọn được
export function MediaCard({ img, selected, onSelect }: { img: MediaImage; selected: boolean; onSelect: (on: boolean) => void }) {
  const unused = img.usedIn.length === 0;
  return (
    <div className={`media-card${selected ? " is-selected" : ""}`}>
      <div className="media-card-thumb">
        <Image src={imageUrl(img.url, 200)} preview={{ src: img.url }} alt={img.name} />
        {unused && <Checkbox className="media-card-check" checked={selected} onChange={(e) => onSelect(e.target.checked)} aria-label={`Chọn ${img.name}`} />}
      </div>
      <div className="media-card-body">
        <Typography.Text strong ellipsis={{ tooltip: img.name }} className="media-card-name">
          {img.name}
        </Typography.Text>
        <Typography.Text type="secondary" className="media-card-meta">
          {img.width}×{img.height} · {formatBytes(img.bytes)} · {new Date(img.createdAt).toLocaleDateString("vi-VN")}
        </Typography.Text>
        {unused ? (
          <Tag color="warning" className="media-card-tag">
            Không dùng
          </Tag>
        ) : (
          <Tooltip title={img.usedIn.join(" · ")}>
            <Typography.Text className="media-card-used" ellipsis>
              {img.usedIn[0]}
              {img.usedIn.length > 1 && ` +${img.usedIn.length - 1}`}
            </Typography.Text>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
