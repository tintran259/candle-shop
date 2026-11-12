// Mùa của concept (docs/pages/concepts.md#thời-gian): concept có ngày bắt đầu / kết thúc (giờ Việt Nam), trống = mọi ngày.
// Sản phẩm thuộc concept chỉ hiện trên web khi có ít nhất một concept KHÔNG ẨN đang trong mùa; concept ẩn bỏ qua;
// sản phẩm không thuộc concept (hiện) nào thì luôn hiện. Không đổi trạng thái Đang bán / Tạm ẩn của sản phẩm — chỉ tính lúc đọc

type Season = { hidden: boolean; startsOn: Date | null; endsOn: Date | null };

// Ngày hôm nay theo giờ Việt Nam (UTC+7), dạng YYYY-MM-DD
export const todayVN = (now = Date.now()) => new Date(now + 7 * 3_600_000).toISOString().slice(0, 10);

// Cột DATE của Postgres về Prisma là nửa đêm UTC của ngày đó
export const dayOf = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);

export function inSeason(c: Pick<Season, 'startsOn' | 'endsOn'>, today: string) {
  const start = dayOf(c.startsOn);
  const end = dayOf(c.endsOn);
  return (!start || start <= today) && (!end || today <= end);
}

export function sellableNow(concepts: Season[], today: string) {
  const visible = concepts.filter((c) => !c.hidden);
  return !visible.length || visible.some((c) => inSeason(c, today));
}
