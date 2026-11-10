// Bộ e2e BO + BE thật: BE chạy cổng 4099 trên schema riêng bo_e2e (Neon, DATABASE_URL trong be/.env), BO build chế độ API ở cổng 3013
import { fileURLToPath } from "node:url";

export const BE_PORT = 4099;
export const BO_PORT = 3013;
export const SCHEMA = "bo_e2e";
export const PIN = "739214";
export const BE_DIR = fileURLToPath(new URL("../../../be", import.meta.url));
export const API = `http://localhost:${BE_PORT}/api`;
