import type { ThemeConfig } from "antd";

// Phong cách "soft minimal bento": nền kem nhạt, thẻ trắng bo lớn không viền,
// một màu nhấn (ember của 2510) chia 4 sắc độ, số lớn nét mảnh.
export const brand = {
  ember: "#b5652e",
  // 4 sắc độ của màu nhấn: nền nhạt (hover/chip) → trung (biểu đồ) → chính → đậm (chữ link, đạt 4.5:1 trên trắng)
  emberLight: "#fbf1e8",
  emberMid: "#e8b48a",
  emberDark: "#7a3f17",
  ink: "#131313",
  inkSoft: "#24252a",
  peanut: "#c9a489",
  page: "#f6f6f3",
  // Nền sidebar: nâu mocha ấm, sáng hơn đen nhưng chữ/logo trắng vẫn đạt 7.2:1
  mocha: "#6b5242",
};

export const text = {
  primary: "#131313",
  secondary: "#454545",
  // #7d7d7d của bản thiết kế chỉ ~4.1:1 trên trắng — đậm lên một chút cho đủ 4.5:1
  tertiary: "#6b6b6b",
  line: "#f1f1f1",
};

export const radius = { card: 20, inner: 12 };

export const theme: ThemeConfig = {
  token: {
    colorPrimary: brand.ember,
    colorInfo: brand.ember,
    colorLink: brand.emberDark,
    colorLinkHover: brand.ember,
    colorText: text.primary,
    colorTextSecondary: text.secondary,
    colorTextTertiary: text.tertiary,
    colorTextDescription: text.tertiary,
    colorBorderSecondary: text.line,
    colorBgLayout: brand.page,
    colorFillAlter: brand.page,
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: 14,
    borderRadius: 10,
    borderRadiusLG: radius.card,
    controlHeight: 36,
    boxShadowTertiary: "none",
  },
  components: {
    Layout: { siderBg: brand.mocha, headerBg: "transparent", bodyBg: brand.page },
    Menu: {
      darkItemBg: brand.mocha,
      darkSubMenuItemBg: brand.mocha,
      darkItemColor: "rgba(255,255,255,0.85)",
      darkItemHoverBg: "rgba(255,255,255,0.08)",
      darkItemSelectedBg: "rgba(255,255,255,0.16)",
      darkItemSelectedColor: "#ffffff",
      darkGroupTitleColor: "rgba(255,255,255,0.7)",
      itemBorderRadius: radius.inner,
      itemHeight: 44,
    },
    // Thẻ trắng, không viền, không vạch dưới tiêu đề
    Card: { colorBorderSecondary: "transparent", headerFontSize: 18, bodyPadding: 24, headerPadding: 24 },
    Table: { headerBg: "transparent", headerSplitColor: "transparent", rowHoverBg: brand.emberLight, borderColor: text.line },
    Statistic: { contentFontSize: 44, titleFontSize: 15 },
    Tabs: { itemColor: text.secondary, titleFontSize: 15 },
    Drawer: { colorBgElevated: brand.page, footerPaddingBlock: 16, footerPaddingInline: 24 },
    Tag: { defaultBg: brand.emberLight, defaultColor: brand.emberDark },
    Segmented: { itemSelectedBg: "#fff", trackBg: brand.page, borderRadius: 999, borderRadiusSM: 999 },
    Progress: { remainingColor: brand.page },
  },
};
