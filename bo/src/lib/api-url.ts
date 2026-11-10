// Địa chỉ API của BE. Đặt VITE_API_URL trong bo/.env.local khi BE chạy chỗ khác (vd https://candle2510-be.onrender.com/api)
export const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");
