// Bảng trên điện thoại: gộp các cột phụ xuống dưới cột chính (mỗi dòng một ô gọn), chỉ giữ vài cột thao tác — không phải vuốt ngang trong bảng.
// main: key cột chính; stack: các cột hiện dưới cột chính (theo thứ tự); keep: cột giữ nguyên (công tắc, nút) — thôi ghim mép, thôi ẩn theo màn
import { Flex, Grid, type TableProps } from "antd";
import type { ColumnType } from "antd/es/table";
import type { Key, ReactNode } from "react";

type Col<T> = ColumnType<T>;
const keyOf = <T,>(c: Col<T>) => String(c.key ?? c.dataIndex);

const cell = <T,>(c: Col<T>, record: T, index: number): ReactNode => {
  const value = c.dataIndex !== undefined ? (record as Record<string, unknown>)[String(c.dataIndex)] : undefined;
  return c.render ? (c.render(value, record, index) as ReactNode) : (value as ReactNode);
};

export function compactColumns<T>(columns: TableProps<T>["columns"], main: string, stack: string[], keep: string[] = []): TableProps<T>["columns"] {
  const list = (columns ?? []) as Col<T>[];
  const byKey = new Map<Key, Col<T>>(list.map((c) => [keyOf(c), c]));
  const head = byKey.get(main)!;
  return list
    .filter((c) => keyOf(c) === main || keep.includes(keyOf(c)))
    .map((c) =>
      keyOf(c) === main
        ? {
            ...head,
            responsive: undefined,
            render: (_: unknown, record: T, index: number) => (
              <Flex vertical gap={6} style={{ minWidth: 0 }}>
                {cell(head, record, index)}
                {stack.map((k) => {
                  const s = byKey.get(k);
                  return s ? <div key={k}>{cell(s, record, index)}</div> : null;
                })}
              </Flex>
            ),
          }
        : { ...c, fixed: undefined, responsive: undefined },
    );
}

// Màn hẹp (dưới 576px) — dùng cho bảng
export const useCompactTable = () => Grid.useBreakpoint().sm === false;
