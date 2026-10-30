import {
  ClockCircleOutlined,
  EnterOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  PlusOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TagOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Button, Empty, Flex, Input, Modal, Spin, Tag, Typography, type InputRef } from "antd";
import { Fragment, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useCraftConfig } from "@/hooks/use-craft-config";
import { useCustomers } from "@/hooks/use-customers";
import { useDiscounts } from "@/hooks/use-discounts";
import { useInventory } from "@/hooks/use-inventory";
import { useOrders } from "@/hooks/use-orders";
import { useProducts } from "@/hooks/use-products";
import { allNavItems } from "@/layouts/nav";
import { matchRange, search, searchGroupLabels, type SearchGroup, type SearchResult } from "@/lib/search";
import { brand, radius, text } from "@/theme";

const groupIcons: Record<SearchGroup, ReactNode> = {
  pages: <FileTextOutlined />,
  orders: <ShoppingCartOutlined />,
  customers: <UserOutlined />,
  products: <ShoppingOutlined />,
  discounts: <TagOutlined />,
  materials: <ExperimentOutlined />,
};

// Thao tác nhanh — hiện khi chưa gõ và tìm được theo tên
const actions: SearchResult[] = [
  { key: "action:new-product", group: "pages", title: "Thêm sản phẩm", to: "/products?edit=new" },
  { key: "action:new-discount", group: "pages", title: "Tạo mã giảm giá", to: "/discounts?edit=new" },
];
const pages = [
  ...allNavItems.map((i) => ({ label: i.label, path: i.path })),
  { label: "Thêm sản phẩm", path: "/products?edit=new", keywords: "tao moi san pham nen" },
  { label: "Tạo mã giảm giá", path: "/discounts?edit=new", keywords: "them ma khuyen mai voucher coupon" },
];

// Kết quả mở gần đây — chỉ là tiện ích trên trình duyệt này
const RECENT_KEY = "bo-search-recent-v1";
const readRecent = (): SearchResult[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as SearchResult[];
  } catch {
    return [];
  }
};
const saveRecent = (list: SearchResult[]) => {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    // Trình duyệt chặn bộ nhớ — bỏ qua, không ảnh hưởng tìm kiếm
  }
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const shortcut = isMac ? "⌘K" : "Ctrl K";

// Ô tìm kiếm trên header: bấm (hoặc Ctrl/⌘ K, phím /) mở bảng tìm nhanh toàn hệ thống
export function GlobalSearch({ compact }: { compact: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && (e.target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName));
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      {compact ? (
        <Button shape="circle" aria-label="Tìm kiếm" icon={<SearchOutlined />} onClick={() => setOpen(true)} style={{ borderColor: "transparent" }} />
      ) : (
        <button type="button" className="search-trigger" aria-label={`Tìm kiếm (${shortcut})`} aria-haspopup="dialog" onClick={() => setOpen(true)}>
          <SearchOutlined aria-hidden />
          <span style={{ flex: 1, textAlign: "left" }}>Tìm đơn, sản phẩm, mã…</span>
          <kbd className="kbd">{shortcut}</kbd>
        </button>
      )}
      <Modal
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
        closable={false}
        destroyOnHidden
        width={640}
        style={{ top: compact ? 16 : 72, maxWidth: "calc(100vw - 32px)" }}
        styles={{ container: { padding: 0, borderRadius: radius.card, overflow: "hidden" } }}
        aria-label="Tìm kiếm"
      >
        <SearchPanel onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<InputRef>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState(readRecent);

  const { orders, loading: l1 } = useOrders();
  const { products, loading: l2 } = useProducts();
  const { discounts, loading: l3 } = useDiscounts();
  const { config: craft, loading: l4 } = useCraftConfig();
  const { customers, loading: l5 } = useCustomers();
  const { materials: inventory, loading: l6 } = useInventory();
  const loading = l1 || l2 || l3 || l4 || l5 || l6;

  const query = q.trim();
  const results = query ? search(query, { pages, orders, customers, products, discounts, craft, inventory }) : [];
  // Chưa gõ: mở gần đây + thao tác nhanh + các trang
  const idle = [
    ...recent.map((r) => ({ ...r, key: `recent:${r.key}` })),
    ...actions,
    ...allNavItems.map((i): SearchResult => ({ key: `page:${i.path}`, group: "pages", title: i.label, to: i.path })),
  ];
  const items = query ? results : idle;
  const current = Math.min(active, Math.max(0, items.length - 1));

  // Modal mở xong mới focus được ô nhập
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${current}"]`)?.scrollIntoView({ block: "nearest" });
  }, [current]);

  const pick = (r: SearchResult) => {
    if (!r.key.startsWith("action:") && !r.key.startsWith("page:")) {
      const plain = { ...r, key: r.key.replace(/^recent:/, "") };
      const next = [plain, ...recent.filter((x) => x.key !== plain.key)].slice(0, 5);
      setRecent(next);
      saveRecent(next);
    }
    onClose();
    navigate(r.to);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!items.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((current + step + items.length) % items.length);
    } else if (e.key === "Enter" && items[current]) {
      e.preventDefault();
      pick(items[current]);
    }
  };

  // Tiêu đề nhóm: kết quả tìm theo loại; lúc chưa gõ chia "Mở gần đây" / "Thao tác nhanh" / "Đi tới trang"
  const sectionOf = (r: SearchResult) =>
    query
      ? searchGroupLabels[r.group]
      : r.key.startsWith("recent:")
        ? "Mở gần đây"
        : r.key.startsWith("action:")
          ? "Thao tác nhanh"
          : "Đi tới trang";

  return (
    <div onKeyDown={onKeyDown}>
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${text.line}` }}>
        <Input
          ref={inputRef}
          variant="filled"
          size="large"
          prefix={<SearchOutlined style={{ color: text.tertiary, marginInlineEnd: 6 }} />}
          suffix={
            <Button size="small" type="text" onClick={onClose} aria-label="Đóng tìm kiếm" style={{ color: text.tertiary }}>
              Esc
            </Button>
          }
          placeholder="Tìm đơn, khách, sản phẩm, mã…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          role="combobox"
          aria-expanded
          aria-controls="global-search-list"
          aria-activedescendant={items[current] ? `search-opt-${current}` : undefined}
          aria-label="Tìm kiếm"
          // Ô nhập dạng viên thuốc giống ô tìm kiếm trên header, chừa khoảng cho icon khỏi dính viền
          style={{ paddingInline: "16px 6px", borderRadius: 999 }}
        />
      </div>

      <div ref={listRef} id="global-search-list" role="listbox" aria-label="Kết quả" style={{ maxHeight: "min(60vh, 480px)", overflowY: "auto", padding: 8 }}>
        {query && loading ? (
          <Flex justify="center" style={{ padding: 32 }}>
            <Spin tip="Đang tải dữ liệu…">
              <div style={{ width: 120, height: 24 }} />
            </Spin>
          </Flex>
        ) : items.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <>
                Không tìm thấy kết quả cho “{query}”.
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                  Thử mã đơn (vd SC251030), tên khách không dấu hoặc 3 số cuối điện thoại.
                </Typography.Text>
              </>
            }
            style={{ padding: "24px 0" }}
          />
        ) : (
          items.map((r, i) => {
            const section = sectionOf(r);
            const showHeader = i === 0 || sectionOf(items[i - 1]) !== section;
            return (
              <Fragment key={r.key}>
                {showHeader && (
                  <Typography.Text type="secondary" style={{ display: "block", fontSize: 12, fontWeight: 600, padding: i ? "12px 8px 4px" : "4px 8px" }}>
                    {section}
                  </Typography.Text>
                )}
                <div
                  id={`search-opt-${i}`}
                  data-index={i}
                  role="option"
                  aria-selected={i === current}
                  className="search-row"
                  onMouseMove={() => i !== current && setActive(i)}
                  onClick={() => pick(r)}
                >
                  <ResultThumb r={r} recent={r.key.startsWith("recent:")} />
                  <Flex vertical style={{ minWidth: 0, flex: 1 }}>
                    <Typography.Text strong ellipsis>
                      <Highlight text={r.title} q={query} />
                    </Typography.Text>
                    {r.subtitle && (
                      <Typography.Text type="secondary" ellipsis style={{ fontSize: 13 }}>
                        <Highlight text={r.subtitle} q={query} />
                      </Typography.Text>
                    )}
                  </Flex>
                  {r.tag && (
                    <Tag color={r.tag.color} style={{ marginInlineEnd: 0, flexShrink: 0 }}>
                      {r.tag.label}
                    </Tag>
                  )}
                  <EnterOutlined className="search-row-enter" aria-hidden />
                </div>
              </Fragment>
            );
          })
        )}
      </div>

      <Flex gap={16} wrap className="search-hints" style={{ padding: "10px 16px", borderTop: `1px solid ${text.line}` }}>
        <span>
          <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> di chuyển
        </span>
        <span>
          <kbd className="kbd">Enter</kbd> mở
        </span>
        <span>
          <kbd className="kbd">Esc</kbd> đóng
        </span>
      </Flex>
    </div>
  );
}

function ResultThumb({ r, recent }: { r: SearchResult; recent: boolean }) {
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
function Highlight({ text: value, q }: { text: string; q: string }) {
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
