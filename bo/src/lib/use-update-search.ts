import { useCallback } from "react";
import { useNavigate } from "react-router";

// Sửa query trên URL dựa vào thanh địa chỉ hiện tại. Hàm trả về giữ nguyên giữa các lần render
// (setSearchParams của react-router đổi theo mỗi lần URL đổi) — nhờ vậy bảng đã memo không phải
// render lại chỉ vì mở/đóng drawer (?order=, ?edit=).
export function useUpdateSearch() {
  const navigate = useNavigate();
  return useCallback(
    (fn: (params: URLSearchParams) => void, replace = false) => {
      const params = new URLSearchParams(window.location.search);
      fn(params);
      const search = params.toString();
      navigate({ search: search ? `?${search}` : "" }, { replace, preventScrollReset: true });
    },
    [navigate],
  );
}
