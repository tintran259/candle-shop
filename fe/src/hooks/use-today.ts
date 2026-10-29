"use client";

import { useSyncExternalStore } from "react";

let today: Date | null = null;
const subscribe = () => () => {};

// Ngày hiện tại, chỉ có ở client — khi prerender trả về null để HTML không "đóng băng" ngày build
export function useToday() {
  return useSyncExternalStore(
    subscribe,
    () => (today ??= new Date()),
    () => null,
  );
}
