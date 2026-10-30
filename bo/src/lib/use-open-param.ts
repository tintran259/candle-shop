import { useCallback, useState } from "react";
import { useSearchParams } from "react-router";
import { useUpdateSearch } from "@/lib/use-update-search";

// Mục đang mở trong drawer nằm trên URL (vd ?order=id, ?edit=new) — tìm kiếm/thông báo link thẳng tới,
// gửi link được, nút Back đóng drawer. Mở thì tạo bước lịch sử mới, đóng thì thay thế.
export function useOpenParam(key: string) {
  const [params] = useSearchParams();
  const update = useUpdateSearch();
  const value = params.get(key);
  const setValue = useCallback(
    (next: string | null) =>
      update((p) => {
        if (next) p.set(key, next);
        else p.delete(key);
      }, !next),
    [update, key],
  );
  return [value, setValue] as const;
}

// Mục drawer đang/vừa hiển thị. Đóng drawer thì URL bỏ ?edit= ngay, nhưng drawer còn trượt ra ~0.3s —
// shown giữ mục cũ để trong lúc đó vẫn hiện đúng nội dung (không nháy "không tìm thấy" hay mất hiệu ứng đóng).
// key đổi mỗi lần mở (kể cả mở lại đúng mục cũ) nhưng giữ nguyên lúc đóng → form luôn bắt đầu mới.
export function useDrawerTarget(value: string | null) {
  const [state, setState] = useState({ value, last: value, session: 0 });
  if (value !== state.value) {
    setState(value === null ? { ...state, value } : { value, last: value, session: state.session + 1 });
  }
  return { shown: value ?? state.last, key: `${state.last ?? "closed"}:${state.session}` };
}
