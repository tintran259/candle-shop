import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Bỏ qua API, file tĩnh, asset của Next và ảnh OG (đã nằm sẵn dưới /vi, /en)
  matcher: "/((?!api|trpc|_next|_vercel|.*opengraph-image|.*\\..*).*)",
};
