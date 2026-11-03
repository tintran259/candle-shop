import { LockOutlined, MailOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Button, Checkbox, Flex, Form, Grid, Input, Typography } from "antd";
import { useEffect, useState, type KeyboardEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { login, safeNext, useSession } from "@/lib/auth";
import { useTitle } from "@/lib/use-title";
import { brand, radius, text } from "@/theme";

type Values = { email: string; password: string; remember: boolean };

const iconStyle = { color: text.tertiary, marginInlineEnd: 4 };

// Đăng nhập BO: một tài khoản quản trị. Vào đúng trang đang mở dở (?next=) sau khi đăng nhập.
export function LoginPage() {
  useTitle("Đăng nhập");
  const session = useSession();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const screens = Grid.useBreakpoint();
  const mobile = screens.md === false;
  const [form] = Form.useForm<Values>();
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  // Sai quá nhiều lần: khóa nút tới thời điểm này, đếm ngược từng giây
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const next = safeNext(params.get("next"));
  const wait = Math.max(0, Math.ceil((lockedUntil - now) / 1000));

  useEffect(() => {
    if (!lockedUntil) return;
    const timer = setInterval(() => {
      setNow(Date.now());
      if (Date.now() >= lockedUntil) {
        setLockedUntil(0);
        setError(undefined);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  if (session) return <Navigate to={next} replace />;

  const finish = async (v: Values) => {
    setBusy(true);
    setError(undefined);
    const result = await login(v.email, v.password, v.remember);
    setBusy(false);
    if (result.ok) return navigate(next, { replace: true });
    if (result.reason === "locked") {
      setNow(Date.now());
      setLockedUntil(Date.now() + (result.retryIn ?? 30) * 1000);
      setError("locked");
    } else setError("Email hoặc mật khẩu không đúng. Kiểm tra lại rồi thử lần nữa.");
    form.setFieldValue("password", "");
    form.getFieldInstance("password")?.focus();
  };

  const checkCaps = (e: KeyboardEvent) => setCapsLock(e.getModifierState("CapsLock"));

  return (
    <Flex vertical={mobile} style={{ minHeight: "100vh", boxSizing: "border-box", padding: mobile ? 12 : 16, gap: mobile ? 12 : 16, background: brand.page }}>
      <BrandPanel mobile={mobile} />

      <Flex vertical align="center" justify={mobile ? "flex-start" : "center"} style={{ flex: "1 1 46%", padding: mobile ? "4px 0 16px" : "32px 24px" }}>
        <main
          style={{
            width: "100%",
            maxWidth: 440,
            boxSizing: "border-box",
            background: "#fff",
            borderRadius: radius.card,
            padding: mobile ? "28px 20px" : "44px 40px 36px",
          }}
        >
          <Typography.Title level={2} style={{ margin: "0 0 6px" }}>
            Chào mừng trở lại
          </Typography.Title>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 28 }}>
            Đăng nhập để quản lý đơn hàng, sản phẩm và kho của 2510.
          </Typography.Paragraph>

          {error && (
            <Alert
              type="error"
              showIcon
              role="alert"
              title={error === "locked" ? `Sai quá nhiều lần. Thử lại sau ${wait} giây.` : error}
              style={{ marginBottom: 20, borderRadius: radius.inner }}
            />
          )}

          <Form form={form} layout="vertical" requiredMark={false} initialValues={{ email: "", password: "", remember: true }} onFinish={finish} disabled={busy}>
            <Form.Item
              name="email"
              label="Email"
              // Dán email hay kèm khoảng trắng
              normalize={(v: string) => v.trim()}
              rules={[
                { required: true, message: "Nhập email." },
                { type: "email", message: "Email chưa đúng định dạng." },
              ]}
            >
              <Input size="large" autoFocus autoComplete="username" inputMode="email" prefix={<MailOutlined style={iconStyle} />} placeholder="admin@2510.vn" style={{ height: 48 }} />
            </Form.Item>
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[{ required: true, message: "Nhập mật khẩu." }]}
              extra={
                capsLock && (
                  <span role="status" style={{ color: "#ad6800" }}>
                    <WarningOutlined /> Đang bật Caps Lock
                  </span>
                )
              }
            >
              <Input.Password
                size="large"
                autoComplete="current-password"
                prefix={<LockOutlined style={iconStyle} />}
                placeholder="Nhập mật khẩu"
                onKeyDown={checkCaps}
                onKeyUp={checkCaps}
                onBlur={() => setCapsLock(false)}
                style={{ height: 48 }}
              />
            </Form.Item>
            <Form.Item name="remember" valuePropName="checked" extra="Bỏ chọn nếu đang dùng máy chung." style={{ marginBottom: 28 }}>
              <Checkbox>Ghi nhớ đăng nhập 30 ngày</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" size="large" block loading={busy} disabled={wait > 0} style={{ height: 48, fontWeight: 600 }}>
              Đăng nhập
            </Button>
          </Form>
        </main>
        <Typography.Text type="secondary" style={{ marginTop: 20, fontSize: 12 }}>
          © {new Date().getFullYear()} 2510 Scented Candle
        </Typography.Text>
      </Flex>
    </Flex>
  );
}

// Khối thương hiệu: ảnh nến 2510 phủ nền mocha, logo bản sáng giữ nguyên như sidebar
function BrandPanel({ mobile }: { mobile: boolean }) {
  return (
    <Flex
      vertical
      justify={mobile ? "center" : "space-between"}
      align={mobile ? "center" : "flex-start"}
      style={{
        flex: mobile ? "none" : "1 1 54%",
        minHeight: mobile ? 168 : undefined,
        borderRadius: radius.card,
        padding: mobile ? 24 : 48,
        backgroundColor: brand.mocha,
        // Mobile: logo nằm giữa ảnh nên phủ đều và đậm hơn để logo không lẫn vào chữ trên hũ nến
        backgroundImage: `${mobile ? "linear-gradient(rgba(74,55,43,0.78), rgba(74,55,43,0.78))" : "linear-gradient(180deg, rgba(74,55,43,0.55) 0%, rgba(74,55,43,0.35) 45%, rgba(58,42,32,0.9) 100%)"}, url("/login-hero.webp")`,
        backgroundSize: "cover",
        backgroundPosition: "center 60%",
      }}
    >
      <Flex vertical align={mobile ? "center" : "flex-start"} gap={10}>
        <img src="/logo-2510-vertical-light.png" alt="2510 Scented Candle" style={{ height: mobile ? 56 : 84, width: "auto" }} />
        <Typography.Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 11, letterSpacing: "0.28em" }}>BACK OFFICE</Typography.Text>
      </Flex>
      {!mobile && (
        <div style={{ maxWidth: 420 }}>
          <Typography.Title level={3} style={{ color: "#fff", fontWeight: 500, lineHeight: 1.35, margin: 0 }}>
            Mỗi ngọn nến được đổ tay theo đơn.
          </Typography.Title>
          <Typography.Paragraph style={{ color: "rgba(255,255,255,0.8)", margin: "10px 0 0" }}>
            Theo dõi đơn, giữ nguyên liệu và cấu hình nến tự phối ở một nơi.
          </Typography.Paragraph>
        </div>
      )}
    </Flex>
  );
}
