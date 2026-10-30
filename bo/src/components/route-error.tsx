import { Button, Flex, Result, Typography } from "antd";
import { useEffect } from "react";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";

// Lỗi tải file code của trang: sau mỗi lần build / deploy, file code từng trang đổi tên (mã băm mới), file cũ bị xóa.
// Tab đang mở còn giữ tên cũ nên chuyển sang trang chưa mở sẽ lỗi "Failed to fetch dynamically imported module".
const isStaleChunk = (e: unknown) =>
  e instanceof Error && /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(e.message);

// Trang báo lỗi thay cho màn hình mặc định của React Router — giữ sidebar, có nút tải lại / về tổng quan
export function RouteError() {
  const error = useRouteError();
  const reload = () => window.location.reload();
  const stale = isStaleChunk(error);

  // Tự tải lại một lần — lúc này URL đã là trang cần mở (tải lại sớm hơn thì về nhầm trang cũ).
  // Vừa tải lại mà vẫn lỗi thì thôi, để admin thấy thông báo và tự bấm.
  useEffect(() => {
    if (!stale) return;
    const key = "bo-reloaded-for-update";
    try {
      if (Date.now() - Number(sessionStorage.getItem(key) ?? 0) < 10_000) return;
      sessionStorage.setItem(key, String(Date.now()));
    } catch {
      return;
    }
    window.location.reload();
  }, [stale]);

  if (stale)
    return (
      <Result
        status="info"
        title="Trang quản trị vừa được cập nhật"
        subTitle="Tải lại để dùng bản mới nhất. Bản nháp đang sửa (Thủ công) và dữ liệu đã lưu không bị mất."
        extra={
          <Button type="primary" onClick={reload}>
            Tải lại trang
          </Button>
        }
      />
    );

  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error instanceof Error ? error.message : String(error);
  return (
    <Result
      status="error"
      title="Có lỗi khi mở trang này"
      subTitle="Thử tải lại trang. Nếu vẫn lỗi, gửi nội dung bên dưới cho đội kỹ thuật."
      extra={
        <Flex vertical align="center" gap={16}>
          <Flex gap={8} justify="center" wrap>
            <Button type="primary" onClick={reload}>
              Tải lại trang
            </Button>
            <Link to="/">
              <Button>Về Tổng quan</Button>
            </Link>
          </Flex>
          <Typography.Text code copyable style={{ maxWidth: 640, whiteSpace: "pre-wrap", textAlign: "left" }}>
            {message}
          </Typography.Text>
        </Flex>
      }
    />
  );
}
