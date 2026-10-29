import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Bỏ qua API, file tĩnh và asset của Next
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
