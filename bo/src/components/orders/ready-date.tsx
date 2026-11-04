import { Alert, Button, DatePicker, Typography, type DatePickerProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import type { Workshop } from "@/hooks/use-workshop";

const DAY = "YYYY-MM-DD";

type PickerProps = Omit<DatePickerProps, "cellRender" | "picker"> & { workshop: Workshop; candles: number };

// Ô chọn ngày làm xong: vạch dưới mỗi ngày theo mức xưởng đã nhận (còn chỗ / gần đầy / vượt khi thêm đơn này), rê chuột thấy số cây
export function CapacityDatePicker({ workshop: w, candles, ...props }: PickerProps) {
  return (
    <DatePicker
      {...props}
      cellRender={(current, info) => {
        if (info.type !== "date" || !w.capacity || !dayjs.isDayjs(current)) return info.originNode;
        const d = w.at(current.format(DAY), candles);
        if (d.load === candles && !d.over) return info.originNode;
        const tone = d.over ? "is-full" : d.load >= d.capacity * 0.8 ? "is-busy" : "is-ok";
        return (
          <div className="cap-cell" title={`Đã nhận ${d.load - candles}/${d.capacity} cây`}>
            {info.originNode}
            <span aria-hidden className={`cap-bar ${tone}`} />
          </div>
        );
      }}
    />
  );
}

// Dòng dưới ô ngày làm xong: số cây đã nhận ngày đó; vượt công suất thì báo và gợi ý ngày còn chỗ
export function CapacityHint({ w, date, candles, onPick }: { w: Workshop; date?: Dayjs | null; candles: number; onPick: (date: Dayjs) => void }) {
  if (!date) return null;
  if (!w.capacity) return <>Xưởng không giới hạn số cây mỗi ngày.</>;
  const d = w.at(date.format(DAY), candles);
  const taken = d.load - candles;
  if (!d.over)
    return (
      <>
        Ngày {date.format("DD/MM")}: xưởng đã nhận {taken}/{d.capacity} cây{candles ? `, thêm đơn này ${candles} cây` : ""}.
      </>
    );
  const suggestion = dayjs(w.suggest(candles));
  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginTop: 8 }}
      title={`Ngày ${date.format("DD/MM")} vượt công suất`}
      description={
        <>
          <Typography.Text>
            Đã nhận {taken}/{d.capacity} cây, thêm đơn này {candles} cây sẽ vượt {d.load - d.capacity} cây.
          </Typography.Text>
          {!suggestion.isSame(date, "day") && (
            <div>
              <Button type="link" size="small" onClick={() => onPick(suggestion)} style={{ padding: 0 }}>
                Dùng ngày {suggestion.format("DD/MM")} còn chỗ
              </Button>
            </div>
          )}
        </>
      }
    />
  );
}
