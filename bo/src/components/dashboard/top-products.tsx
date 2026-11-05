import { ExperimentOutlined } from "@ant-design/icons";
import { Avatar, Card, Empty, Flex, Typography } from "antd";
import { MoreLink } from "@/components/more-link";
import type { ProductSales } from "@/lib/dashboard/stats";
import { formatMoneyShort, formatNumber } from "@/lib/format";
import { brand } from "@/theme";

export function TopProducts({ rows, days }: { rows: ProductSales[]; days: number }) {
  return (
    <Card title="Sản phẩm bán chạy" extra={<Typography.Text type="secondary">{days} ngày qua</Typography.Text>} style={{ height: "100%" }}>
      {rows.length ? (
        <Flex vertical gap={2} style={{ margin: "-8px -12px 0" }}>
          {rows.map((p, i) => (
            <Flex key={p.id} align="center" gap={12} className="list-row">
              <Typography.Text type="secondary" strong className="tabular" style={{ width: 16 }}>
                {i + 1}
              </Typography.Text>
              <Avatar
                shape="square"
                size={44}
                src={p.image}
                icon={p.image ? undefined : <ExperimentOutlined style={{ color: brand.emberDark }} />}
                alt=""
                style={{ borderRadius: 12, background: brand.emberLight, flexShrink: 0 }}
              />
              <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                <Typography.Text strong ellipsis>
                  {p.name}
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatNumber(p.sold)} đã bán
                </Typography.Text>
              </Flex>
              <Typography.Text strong className="tabular">
                {formatMoneyShort(p.revenue)}
              </Typography.Text>
            </Flex>
          ))}
        </Flex>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn trong kỳ này." />
      )}
      <div style={{ marginTop: 16 }}>
        <MoreLink to="/products">Tất cả sản phẩm</MoreLink>
      </div>
    </Card>
  );
}
