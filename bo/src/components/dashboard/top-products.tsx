import { WarningOutlined } from "@ant-design/icons";
import { Avatar, Card, Flex, Tag, Typography } from "antd";
import { MoreLink } from "@/components/more-link";
import { formatMoneyShort, formatNumber } from "@/lib/format";
import { topProducts } from "@/lib/mock";

const LOW_STOCK = 10;

export function TopProducts() {
  return (
    <Card
      title="Sản phẩm bán chạy"
      extra={<Typography.Text type="secondary">30 ngày qua</Typography.Text>}
      style={{ height: "100%" }}
    >
      <Flex vertical gap={2} style={{ margin: "-8px -12px 0" }}>
        {topProducts.map((p, i) => (
          <Flex key={p.id} align="center" gap={12} className="list-row">
            <Typography.Text type="secondary" strong className="tabular" style={{ width: 16 }}>
              {i + 1}
            </Typography.Text>
            <Avatar shape="square" size={44} src={p.image} alt="" style={{ borderRadius: 12 }} />
            <Flex vertical style={{ flex: 1, minWidth: 0 }}>
              <Typography.Text strong ellipsis>
                {p.name}
              </Typography.Text>
              <Flex gap={6} align="center" wrap>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {formatNumber(p.sold)} đã bán
                </Typography.Text>
                {p.stock < LOW_STOCK && (
                  <Tag color="warning" icon={<WarningOutlined />}>
                    Còn {p.stock}
                  </Tag>
                )}
              </Flex>
            </Flex>
            <Typography.Text strong className="tabular">
              {formatMoneyShort(p.revenue)}
            </Typography.Text>
          </Flex>
        ))}
      </Flex>
      <div style={{ marginTop: 16 }}>
        <MoreLink to="/products">Tất cả sản phẩm</MoreLink>
      </div>
    </Card>
  );
}
