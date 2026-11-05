import { ClockCircleOutlined, ExperimentOutlined, FileTextOutlined, PlusOutlined, ShoppingCartOutlined, ShoppingOutlined, TagOutlined, UserOutlined } from "@ant-design/icons";
import { Flex } from "antd";
import type { ReactNode } from "react";
import { matchRange, type SearchGroup, type SearchResult } from "@/lib/search";
import { brand, radius } from "@/theme";

const groupIcons: Record<SearchGroup, ReactNode> = {
  pages: <FileTextOutlined />,
  orders: <ShoppingCartOutlined />,
  customers: <UserOutlined />,
  products: <ShoppingOutlined />,
  discounts: <TagOutlined />,
  materials: <ExperimentOutlined />,
};

// Ảnh nhỏ và chữ tô đậm phần khớp trong kết quả tìm nhanh
export function ResultThumb({ r, recent }: { r: SearchResult; recent: boolean }) {
  const box = { width: 40, height: 40, borderRadius: radius.inner, flexShrink: 0 } as const;
  if (r.image) return <img src={r.image} alt="" style={{ ...box, objectFit: "cover" }} />;
  if (r.swatch) return <span aria-hidden style={{ ...box, background: r.swatch, boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.08)" }} />;
  const icon = recent ? <ClockCircleOutlined /> : r.key.startsWith("action:") ? <PlusOutlined /> : groupIcons[r.group];
  return (
    <Flex aria-hidden align="center" justify="center" style={{ ...box, background: brand.emberLight, color: brand.emberDark, fontSize: 16 }}>
      {icon}
    </Flex>
  );
}

// Tô đậm đoạn khớp (không phân biệt dấu)
export function Highlight({ text: value, q }: { text: string; q: string }) {
  const range = q ? matchRange(value, q) : null;
  if (!range) return <>{value}</>;
  const chars = Array.from(value);
  return (
    <>
      {chars.slice(0, range[0]).join("")}
      <mark className="search-mark">{chars.slice(range[0], range[1]).join("")}</mark>
      {chars.slice(range[1]).join("")}
    </>
  );
}
