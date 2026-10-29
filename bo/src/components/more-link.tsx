import { ArrowRightOutlined } from "@ant-design/icons";
import type { ReactNode } from "react";
import { Link } from "react-router";

// Link "Xem thêm →" ở đáy mỗi widget
export function MoreLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="more-link" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
      {children}
      <ArrowRightOutlined style={{ fontSize: 12 }} aria-hidden />
    </Link>
  );
}
