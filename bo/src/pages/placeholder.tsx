import { ToolOutlined } from "@ant-design/icons";
import { Button, Result } from "antd";
import { useNavigate, useParams } from "react-router";
import { allNavItems } from "@/layouts/nav";
import { useTitle } from "@/lib/use-title";
import { brand } from "@/theme";

// Trang tạm cho các mục menu chưa làm
export function PlaceholderPage() {
  const { section } = useParams();
  const item = allNavItems.find((i) => i.path === `/${section}`);
  useTitle(item?.label ?? "Không tìm thấy");
  if (!item) return <NotFoundPage />;
  return (
    <Result
      icon={<ToolOutlined style={{ color: brand.ember }} />}
      title={item.label}
      subTitle="Trang này đang được xây dựng."
      extra={<BackHome />}
    />
  );
}

export function NotFoundPage() {
  useTitle("Không tìm thấy");
  return <Result status="404" title="404" subTitle="Trang bạn tìm không tồn tại." extra={<BackHome />} />;
}

function BackHome() {
  const navigate = useNavigate();
  return (
    <Button type="primary" onClick={() => navigate("/")}>
      Về Dashboard
    </Button>
  );
}
