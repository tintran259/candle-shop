import { createCn } from "cn/config";

// Khai báo thang chữ riêng (globals.css) để cn không nhầm text-display-* là màu chữ
export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display-xl", "display-lg", "display-md", "display-sm", "body", "caption"] }],
    },
  },
});
