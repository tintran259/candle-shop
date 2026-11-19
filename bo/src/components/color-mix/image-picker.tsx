import { BulbOutlined, CameraOutlined, SwapOutlined } from "@ant-design/icons";
import { Alert, Button, Flex, Modal, Segmented, Slider, Tag, Typography, Upload } from "antd";
import { useRef, useState } from "react";
import { hexToLinear, linearToHex, toLinear, whiteBalance, whiteRefTooDark, type Rgb } from "@/lib/color-mix/color";

// Lấy màu từ ảnh chụp mẫu: chọn / kéo thả ảnh, bấm vào giữa bề mặt mẫu → màu trung bình (theo RGB tuyến tính) trong vòng tròn bán kính r px.
// Có whiteRef (màu mẫu trắng đã lưu): bấm vào mẫu trắng trong cùng ảnh → hiệu chỉnh màu cả ảnh theo nó (lib/color-mix/color.ts whiteBalance).
// Ảnh chỉ đọc trên trình duyệt, không tải lên đâu
const MAX_SIDE = 1600;
const TIPS = "Chụp mẫu đã khô hẳn, dưới ánh sáng ban ngày gián tiếp, không flash, tắt HDR và bộ lọc làm đẹp. Bấm vào giữa bề mặt mẫu, tránh bóng, cạnh và chỗ phản sáng.";
const TIPS_WHITE = " Chụp kèm mẫu trắng trong cùng ảnh để hiệu chỉnh — màu lấy được ít phụ thuộc đèn và máy chụp.";

type Target = "sample" | "white";
type Mark = { x: number; y: number; r: number };

export function ImagePicker({ open, onClose, onPick, whiteRef }: { open: boolean; onClose: () => void; onPick: (hex: string) => void; whiteRef?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixels = useRef<ImageData | null>(null);
  const marks = useRef<Partial<Record<Target, Mark>>>({});
  const [loaded, setLoaded] = useState(false);
  const [radius, setRadius] = useState(10);
  const [target, setTarget] = useState<Target>("sample");
  const [raw, setRaw] = useState<Rgb | null>(null);
  const [white, setWhite] = useState<Rgb | null>(null);
  const [whiteError, setWhiteError] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const calibrated = Boolean(whiteRef && white);
  const picked = raw ? linearToHex(calibrated ? whiteBalance(raw, white!, hexToLinear(whiteRef!)) : raw) : null;

  const reset = () => {
    marks.current = {};
    setRaw(null);
    setWhite(null);
    setWhiteError(false);
    setTarget("sample");
  };

  const loadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const cv = canvasRef.current;
      if (!cv) return;
      const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
      cv.width = Math.round(img.width * scale);
      cv.height = Math.round(img.height * scale);
      const ctx = cv.getContext("2d")!;
      ctx.drawImage(img, 0, 0, cv.width, cv.height);
      pixels.current = ctx.getImageData(0, 0, cv.width, cv.height);
      URL.revokeObjectURL(url);
      setLoaded(true);
      setLoadError(false);
      reset();
    };
    // Ảnh trình duyệt không đọc được (vd HEIC của iPhone trên Edge / Chrome Windows)
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setLoadError(true);
    };
    img.src = url;
  };

  // Chọn ảnh qua Upload của antd nhưng không tải lên đâu: đọc ngay rồi trả false
  const pickProps = {
    accept: "image/*",
    showUploadList: false,
    beforeUpload: (file: File) => {
      loadFile(file);
      return false;
    },
  };

  // Vẽ lại ảnh + vòng đánh dấu: mẫu màu viền trắng / đen, mẫu trắng viền xanh nét đứt
  const drawMarks = () => {
    const cv = canvasRef.current;
    const data = pixels.current;
    if (!cv || !data) return;
    const ctx = cv.getContext("2d")!;
    ctx.putImageData(data, 0, 0);
    const w = Math.max(2, cv.width / 400);
    ctx.lineWidth = w;
    const ring = (m: Mark, color: string, r: number, dash: number[] = []) => {
      ctx.setLineDash(dash);
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.arc(m.x, m.y, r, 0, Math.PI * 2);
      ctx.stroke();
    };
    const s = marks.current.sample;
    if (s) {
      ring(s, "#fff", s.r + 2);
      ring(s, "#000", s.r + 2 + w);
    }
    const t = marks.current.white;
    if (t) {
      ring(t, "#fff", t.r + 2);
      ring(t, "#1677ff", t.r + 2 + w, [w * 3, w * 2]);
    }
    ctx.setLineDash([]);
  };

  // Màu trung bình (RGB tuyến tính) trong vòng tròn tâm (x, y) bán kính r
  const average = (x: number, y: number, r: number): Rgb | null => {
    const data = pixels.current;
    if (!data) return null;
    const sum = [0, 0, 0];
    let n = 0;
    for (let yy = y - r; yy <= y + r; yy++)
      for (let xx = x - r; xx <= x + r; xx++) {
        if (xx < 0 || yy < 0 || xx >= data.width || yy >= data.height || (xx - x) ** 2 + (yy - y) ** 2 > r * r) continue;
        const i = (yy * data.width + xx) * 4;
        for (let c = 0; c < 3; c++) sum[c] += toLinear(data.data[i + c] / 255);
        n++;
      }
    return n ? (sum.map((v) => v / n) as Rgb) : null;
  };

  // Đổi cỡ vùng sau khi đã bấm: giữ điểm đã chọn, vẽ lại vòng theo cỡ mới và tính lại màu (mẫu màu; mẫu trắng nếu có)
  const changeRadius = (r: number) => {
    setRadius(r);
    const s = marks.current.sample;
    if (s) {
      marks.current.sample = { ...s, r };
      const avg = average(s.x, s.y, r);
      if (avg) setRaw(avg);
    }
    const t = marks.current.white;
    if (t) {
      const avg = average(t.x, t.y, r);
      if (avg && !whiteRefTooDark(avg)) {
        marks.current.white = { ...t, r };
        setWhite(avg);
      }
    }
    drawMarks();
  };

  const sample = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    if (!cv || !pixels.current) return;
    const rect = cv.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) * cv.width) / rect.width);
    const y = Math.round(((e.clientY - rect.top) * cv.height) / rect.height);
    const avg = average(x, y, radius);
    if (!avg) return;
    if (target === "white") {
      if (whiteRefTooDark(avg)) {
        setWhiteError(true);
        return;
      }
      setWhiteError(false);
      setWhite(avg);
      marks.current.white = { x, y, r: radius };
      setTarget("sample"); // xong mẫu trắng thì quay lại lấy màu mẫu
    } else {
      setRaw(avg);
      marks.current.sample = { x, y, r: radius };
    }
    drawMarks();
  };

  const clearWhite = () => {
    setWhite(null);
    setWhiteError(false);
    delete marks.current.white;
    drawMarks();
  };

  return (
    <Modal
      title="Lấy màu từ ảnh"
      open={open}
      onCancel={onClose}
      width={loaded ? 860 : 560}
      destroyOnHidden={false}
      footer={
        <Flex justify="space-between" align="center" gap={12} wrap>
          <Flex align="center" gap={12} className="color-pick-result">
            <span className={`color-pick-swatch${picked ? "" : " is-empty"}`} style={picked ? { background: picked } : undefined} />
            <Flex vertical align="flex-start">
              <Typography.Text type="secondary" className="color-pick-label">
                {calibrated ? "Màu đã lấy (đã hiệu chỉnh)" : "Màu đã lấy"}
              </Typography.Text>
              {picked ? (
                <Typography.Text strong copyable className="color-pick-hex">
                  {picked}
                </Typography.Text>
              ) : (
                <Typography.Text type="secondary">{loaded ? "Bấm vào ảnh để lấy màu" : "Chưa chọn ảnh"}</Typography.Text>
              )}
              {calibrated && raw && (
                <Typography.Text type="secondary" className="color-pick-label">
                  Trong ảnh: {linearToHex(raw)}
                </Typography.Text>
              )}
            </Flex>
          </Flex>
          <Flex gap={8}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              disabled={!picked}
              onClick={() => {
                if (picked) onPick(picked);
                onClose();
              }}
            >
              Dùng màu này
            </Button>
          </Flex>
        </Flex>
      }
    >
      {!loaded && (
        <Upload.Dragger {...pickProps} className="color-pick-drop">
          <CameraOutlined className="color-pick-drop-icon" />
          <div className="color-pick-drop-title">Bấm hoặc kéo thả ảnh mẫu vào đây</div>
          <Typography.Text type="secondary">JPG, PNG, WebP — ảnh chỉ đọc trên máy, không tải lên</Typography.Text>
        </Upload.Dragger>
      )}

      {loadError && (
        <Alert
          type="error"
          showIcon
          title="Không đọc được ảnh này"
          description="Ảnh iPhone dạng HEIC thường không mở được trên máy tính. Chụp màn hình ảnh đó, hoặc đặt máy ảnh iPhone ở chế độ Tương thích nhất (JPG) rồi chụp lại."
          style={{ margin: "12px 0" }}
        />
      )}

      {loaded && (
        <Flex wrap align="center" justify="space-between" gap={12} className="color-pick-toolbar">
          <Flex align="center" gap={12} className="color-pick-radius">
            <Typography.Text type="secondary">Vùng lấy trung bình</Typography.Text>
            <Slider min={1} max={40} value={radius} onChange={changeRadius} aria-label="Bán kính vùng lấy trung bình" tooltip={{ formatter: (v) => `${v}px` }} />
            <Typography.Text className="color-pick-radius-value">{radius}px</Typography.Text>
          </Flex>
          <Upload {...pickProps}>
            <Button icon={<SwapOutlined />}>Đổi ảnh</Button>
          </Upload>
        </Flex>
      )}

      {loaded && whiteRef && (
        <Flex wrap align="center" gap={8} className="color-pick-calib">
          <Typography.Text type="secondary">Bấm vào ảnh để lấy:</Typography.Text>
          <Segmented<Target>
            value={target}
            onChange={setTarget}
            options={[
              { value: "sample", label: "Màu mẫu" },
              { value: "white", label: "Mẫu trắng (hiệu chỉnh)" },
            ]}
          />
          {calibrated ? (
            <Tag color="blue" closable onClose={clearWhite} className="color-pick-calib-tag">
              <span className="color-mix-dot" style={{ background: whiteRef }} />
              Đã hiệu chỉnh theo mẫu trắng
            </Tag>
          ) : (
            <Typography.Text type="secondary" className="color-pick-label">
              Chưa hiệu chỉnh
            </Typography.Text>
          )}
        </Flex>
      )}
      {whiteError && <Alert type="warning" showIcon title="Chỗ vừa bấm tối quá, không giống mẫu trắng — bấm lại vào giữa mẫu trắng." style={{ marginBottom: 12 }} />}

      <div className="color-pick-stage" style={{ display: loaded ? "flex" : "none" }}>
        <canvas
          ref={canvasRef}
          onClick={sample}
          className={`color-mix-canvas${target === "white" ? " is-white" : ""}`}
          aria-label={target === "white" ? "Ảnh mẫu — bấm vào mẫu trắng để hiệu chỉnh" : "Ảnh mẫu — bấm để lấy màu"}
        />
      </div>

      <Flex gap={8} align="flex-start" className="color-pick-tip">
        <BulbOutlined />
        <span>
          {TIPS}
          {whiteRef && TIPS_WHITE}
        </span>
      </Flex>
    </Modal>
  );
}
