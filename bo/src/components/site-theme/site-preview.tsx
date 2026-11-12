import { ExpandOutlined, ZoomInOutlined, ZoomOutOutlined } from "@ant-design/icons";
import { Button, Flex, Modal, Segmented, Tooltip, Typography } from "antd";
import { useLayoutEffect, useRef, useState } from "react";
import { PreviewHeader, PreviewPage } from "@/components/site-theme/preview-page";
import { PAGE, type Device } from "@/lib/site-theme/preview";
import type { BaseTheme } from "@/lib/site-theme/types";

const ZOOMS = [1, 1.25, 1.5, 2, 3];

// Khung xem trước cuộn được như đang lướt web: trang chủ dựng ở bề ngang thật (1280 / 390px) rồi thu cho vừa khung (CSS zoom);
// phóng to thì cuộn ngang được. Thanh điều hướng dính trên cùng, cuộn qua hero thì đổi nền kem + logo tối như web
function Frame({ theme, device, level, style }: { theme: BaseTheme; device: Device; level: number; style: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current!;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const page = PAGE[device];
  const zoom = width ? (width / page.w) * level : 0;
  const solid = zoom > 0 && top / zoom > page.hero - page.bar;

  return (
    <div
      ref={ref}
      aria-label="Xem trước trang chủ"
      onScroll={(e) => setTop(e.currentTarget.scrollTop)}
      style={{ overflowY: "auto", overflowX: level > 1 ? "auto" : "hidden", borderRadius: 8, background: "#f5f2e9", border: "1px solid #e5e2da", scrollbarWidth: "thin", ...style }}
    >
      {zoom > 0 && (
        <div style={{ zoom, width: page.w }}>
          {/* Dính trên cùng, đè lên hero (như web) */}
          <div style={{ position: "sticky", top: 0, zIndex: 2, height: 0 }}>
            <PreviewHeader theme={theme} device={device} solid={solid} />
          </div>
          <PreviewPage theme={theme} device={device} />
        </div>
      )}
    </div>
  );
}

function Controls({ device, setDevice, level, setLevel, extra }: { device: Device; setDevice: (d: Device) => void; level: number; setLevel: (n: number) => void; extra?: React.ReactNode }) {
  const i = ZOOMS.indexOf(level);
  return (
    <Flex gap={8} align="center" wrap>
      <Segmented
        size="small"
        value={device}
        onChange={(v) => setDevice(v as Device)}
        options={[
          { value: "desktop", label: "Máy tính" },
          { value: "mobile", label: "Điện thoại" },
        ]}
      />
      <Flex align="center" gap={2}>
        <Tooltip title="Thu nhỏ">
          <Button size="small" type="text" icon={<ZoomOutOutlined />} disabled={i <= 0} onClick={() => setLevel(ZOOMS[i - 1])} aria-label="Thu nhỏ" />
        </Tooltip>
        <Typography.Text style={{ fontSize: 12, minWidth: 40, textAlign: "center" }} aria-live="polite">
          {Math.round(level * 100)}%
        </Typography.Text>
        <Tooltip title="Phóng to">
          <Button size="small" type="text" icon={<ZoomInOutlined />} disabled={i >= ZOOMS.length - 1} onClick={() => setLevel(ZOOMS[i + 1])} aria-label="Phóng to" />
        </Tooltip>
      </Flex>
      {extra}
    </Flex>
  );
}

// Ô xem trước bên cạnh form + nút mở cửa sổ lớn
export function SitePreview({ theme }: { theme: BaseTheme }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [level, setLevel] = useState(1);
  const [open, setOpen] = useState(false);
  const [big, setBig] = useState({ device: "desktop" as Device, level: 1 });
  const mobile = device === "mobile";

  return (
    <div>
      <Controls
        device={device}
        setDevice={setDevice}
        level={level}
        setLevel={setLevel}
        extra={
          <Button size="small" icon={<ExpandOutlined />} onClick={() => (setBig({ device, level: 1 }), setOpen(true))} style={{ marginLeft: "auto" }}>
            Mở lớn
          </Button>
        }
      />
      <Typography.Paragraph type="secondary" style={{ fontSize: 12, margin: "8px 0" }}>
        Cuộn trong khung để xem như đang lướt web.
      </Typography.Paragraph>
      <Frame key={device} theme={theme} device={device} level={level} style={mobile ? { width: 300, height: 600, margin: "0 auto" } : { width: "100%", aspectRatio: "16 / 11" }} />

      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        width={big.device === "mobile" ? 460 : "min(1340px, 96vw)"}
        centered
        destroyOnHidden
        title={
          <Flex gap={16} align="center" wrap>
            Xem trước trang chủ
            <Controls device={big.device} setDevice={(d) => setBig({ device: d, level: 1 })} level={big.level} setLevel={(l) => setBig((b) => ({ ...b, level: l }))} />
          </Flex>
        }
      >
        <Frame key={big.device} theme={theme} device={big.device} level={big.level} style={{ width: "100%", height: "78vh" }} />
      </Modal>
    </div>
  );
}
