import { ExclamationCircleFilled, LoadingOutlined, LockOutlined } from "@ant-design/icons";
import { Checkbox, Flex, Grid, Typography } from "antd";
import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { BrandPanel } from "@/components/login/brand-panel";
import { PinField } from "@/components/login/pin-field";
import { login, PIN_LENGTH, safeNext, useSession } from "@/lib/auth";
import { useTitle } from "@/lib/use-title";
import { brand, radius } from "@/theme";

type Notice = { tone: "error" | "warning"; text: string } | null;

// 900 giây → "15:00"; trên 1 giờ → "1 giờ 05 phút"
const countdown = (s: number) => {
  if (s >= 3600) return `${Math.floor(s / 3600)} giờ ${String(Math.floor((s % 3600) / 60)).padStart(2, "0")} phút`;
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const toneColor = { error: "#cf1322", warning: "#ad4e00" };

// Đăng nhập BO bằng PIN 6 số (docs/pages/login.md): chỉ một ô PIN, đủ 6 số thì tự đăng nhập; vào đúng trang đang mở dở (?next=)
export function LoginPage() {
  useTitle("Đăng nhập");
  const session = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mobile = Grid.useBreakpoint().md === false;
  const input = useRef<HTMLInputElement>(null);
  const [pin, setPin] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [wrong, setWrong] = useState(false);
  const [shake, setShake] = useState(0);
  // BE khóa đăng nhập tới thời điểm này; đếm ngược từng giây
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const next = safeNext(params.get("next"));
  const wait = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  const locked = wait > 0;

  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lockedUntil) {
        setLockedUntil(0);
        setNotice(null);
        setTimeout(() => input.current?.focus());
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  if (session) return <Navigate to={next} replace />;

  const submit = async (value: string) => {
    if (value.length !== PIN_LENGTH || busy || locked) return;
    setBusy(true);
    setNotice(null);
    const r = await login(value, remember);
    setBusy(false);
    if (r.ok) return navigate(next, { replace: true });
    setPin("");
    if (r.reason === "invalid") {
      setWrong(true);
      setShake((n) => n + 1);
      const left = r.remaining;
      setNotice(
        left !== undefined && left <= 2
          ? { tone: "warning", text: `PIN không đúng. Còn ${left} lần thử trước khi bị tạm khóa.` }
          : { tone: "error", text: left !== undefined ? `PIN không đúng. Còn ${left} lần thử.` : "PIN không đúng." },
      );
    } else if (r.reason === "locked") {
      setNow(Date.now());
      setLockedUntil(Date.now() + r.retryIn * 1000);
      setNotice({ tone: "error", text: "locked" });
    } else if (r.reason === "offline") setNotice({ tone: "error", text: "Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại." });
    else setNotice({ tone: "error", text: r.message ?? "Máy chủ đang lỗi, thử lại sau ít phút." });
    setTimeout(() => input.current?.focus());
  };

  const change = (value: string) => {
    setWrong(false);
    if (notice && notice.text !== "locked") setNotice(null);
    setPin(value);
    // Đủ 6 số thì tự đăng nhập
    if (value.length === PIN_LENGTH) void submit(value);
  };

  const message = notice?.text === "locked" ? `Nhập sai PIN nhiều lần nên đăng nhập đang tạm khóa. Thử lại sau ${countdown(wait)}.` : notice?.text;

  return (
    <Flex vertical={mobile} style={{ minHeight: "100vh", boxSizing: "border-box", padding: mobile ? 12 : 16, gap: mobile ? 12 : 16, background: brand.page }}>
      <BrandPanel mobile={mobile} />

      <Flex vertical align="center" justify={mobile ? "flex-start" : "center"} style={{ flex: "1 1 46%", padding: mobile ? "4px 0 16px" : "32px 24px" }}>
        <main
          style={{ width: "100%", maxWidth: 440, boxSizing: "border-box", background: "#fff", borderRadius: radius.card, padding: mobile ? "32px 20px 28px" : "48px 40px 40px", textAlign: "center" }}
        >
          <span
            aria-hidden
            style={{ width: 48, height: 48, borderRadius: 14, background: brand.emberLight, color: brand.emberDark, display: "inline-grid", placeItems: "center", fontSize: 20, marginBottom: 16 }}
          >
            <LockOutlined />
          </span>
          <Typography.Title level={2} style={{ margin: "0 0 6px", fontSize: mobile ? 24 : 28 }}>
            Nhập mã PIN
          </Typography.Title>
          <Typography.Paragraph type="secondary" id="pin-help" style={{ marginBottom: 28 }}>
            Mã {PIN_LENGTH} số để vào trang quản lý 2510.
          </Typography.Paragraph>

          <PinField
            ref={input}
            value={pin}
            onChange={change}
            onEnter={() => void submit(pin)}
            error={wrong}
            shakeKey={shake}
            disabled={locked}
            readOnly={busy}
            describedBy={message ? "pin-help pin-notice" : "pin-help"}
          />

          {/* Một dòng trạng thái ngay dưới ô PIN, giữ sẵn chỗ để bố cục không nhảy */}
          <div aria-live="polite" style={{ minHeight: 44, marginTop: 14, fontSize: 14, lineHeight: 1.5 }}>
            {busy ? (
              <Typography.Text type="secondary" aria-busy>
                <LoadingOutlined style={{ marginInlineEnd: 6 }} />
                Đang kiểm tra…
              </Typography.Text>
            ) : (
              message && (
                <span id="pin-notice" role="alert" style={{ color: toneColor[notice!.tone] }}>
                  <ExclamationCircleFilled style={{ marginInlineEnd: 6 }} />
                  {message}
                </span>
              )
            )}
          </div>

          <Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={busy} style={{ marginTop: 4 }}>
            Ghi nhớ trên máy này 30 ngày
          </Checkbox>
        </main>
        <Typography.Text type="secondary" style={{ marginTop: 20, fontSize: 12 }}>
          © {new Date().getFullYear()} 2510 Scented Candle
        </Typography.Text>
      </Flex>
    </Flex>
  );
}
