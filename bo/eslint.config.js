import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended, reactHooks.configs.flat.recommended, reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      // Tooltip của antd làm nút trên điện thoại phải chạm 2 lần — dùng @/components/tooltip
      "no-restricted-imports": ["error", { paths: [{ name: "antd", importNames: ["Tooltip"], message: "Dùng Tooltip ở @/components/tooltip (điện thoại chạm một lần)." }] }],
    },
  },
  { files: ["src/components/tooltip.tsx"], rules: { "no-restricted-imports": "off" } },
]);
