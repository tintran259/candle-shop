import { create } from "zustand";
import { persist } from "zustand/middleware";

export type User = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
};

type AuthState = {
  user: User | null;
  setUser: (user: User | null) => void;
};

// Chỉ lưu thông tin hiển thị; phiên thật do cookie httpOnly của BE quản lý
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
    }),
    { name: "scandleted-auth", skipHydration: true },
  ),
);
