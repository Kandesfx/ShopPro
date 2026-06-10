import React, { useEffect, useState } from 'react';
import { Row, Col, Table, Card, Statistic } from 'antd';
import {
  ShoppingOutlined,
  ShoppingCartOutlined,
  DollarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { reportsApi, ordersApi } from '../api/client';
import { StatCard } from '../components/StatCard';

interface DashboardData {
  today: { orders: number; revenue: number };
  this_month: { orders: number; revenue: number };
  pending_orders: number;
  low_stock_alerts: number;
  recent_orders: any[];
  top_selling_today: any[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
};

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await reportsApi.getDashboard();
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const columns = [
    {
      title: 'Mã Đơn',
      dataIndex: 'order_number',
      key: 'order_number',
    },
    {
      title: 'Khách Hàng',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'total_amount',
      key: 'total_amount',
      render: (value: number) => (
        <span style={{ fontWeight: 600 }}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: 'gold',
          confirmed: 'blue',
          processing: 'purple',
          shipped: 'cyan',
          delivered: 'green',
          completed: 'green',
          cancelled: 'red',
        };
        return (
          <span style={{ textTransform: 'none', color: colors[status], fontWeight: 500 }}>
            {STATUS_LABELS[status] || status}
          </span>
        );
      },
    },
    {
      title: 'Ngày',
      dataIndex: 'ordered_at',
      key: 'ordered_at',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Đang tải...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#0f172a' }}>
        Tổng Quan
      </h1>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đơn Hàng Hôm Nay"
            value={data?.today.orders || 0}
            icon={<ShoppingCartOutlined />}
            color="#3b82f6"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Doanh Thu Hôm Nay"
            value={formatCurrency(data?.today.revenue || 0)}
            icon={<DollarOutlined />}
            color="#10b981"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đơn Chờ Xác Nhận"
            value={data?.pending_orders || 0}
            icon={<ShoppingOutlined />}
            color="#f59e0b"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Cảnh Báo Hết Hàng"
            value={data?.low_stock_alerts || 0}
            icon={<WarningOutlined />}
            color="#ef4444"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="Đơn Hàng Gần Đây"
            style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}
            headStyle={{ fontWeight: 600 }}
          >
            <Table
              columns={columns}
              dataSource={data?.recent_orders || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card
            title="Bán Chạy Hôm Nay"
            style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}
            headStyle={{ fontWeight: 600 }}
          >
            {(data?.top_selling_today?.length ?? 0) > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {data!.top_selling_today.map((item: any, index: number) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom: index < data!.top_selling_today.length - 1 ? '1px solid #f1f5f9' : 'none',
                    }}
                  >
                    <span style={{ color: '#334155', fontSize: 14 }}>{item.product_name}</span>
                    <span style={{ fontWeight: 700, color: '#0f172a' }}>{item.quantity} đã bán</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: '#94a3b8' }}>Chưa có đơn hàng hôm nay</p>
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card
            title="Tháng Này"
            style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}
            headStyle={{ fontWeight: 600 }}
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Tổng Đơn Hàng"
                  value={data?.this_month.orders || 0}
                  valueStyle={{ fontWeight: 700, color: '#0f172a' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Tổng Doanh Thu"
                  value={data?.this_month.revenue || 0}
                  prefix="₫"
                  valueStyle={{ fontWeight: 700, color: '#10b981' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default Dashboard;
