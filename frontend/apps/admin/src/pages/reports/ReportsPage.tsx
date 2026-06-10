import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Table } from 'antd';
import { reportsApi } from '../../api/client';
import { StatCard } from '../../components/StatCard';

export function ReportsPage() {
  const [salesData, setSalesData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const [salesRes, productRes, customerRes] = await Promise.all([
        reportsApi.getSales({}),
        reportsApi.getProducts({}),
        reportsApi.getCustomers({}),
      ]);

      if (salesRes.data.success) setSalesData(salesRes.data.data);
      if (productRes.data.success) setProductData(productRes.data.data);
      if (customerRes.data.success) setCustomerData(customerRes.data.data);
    } catch (error) {
      console.error('Lỗi khi tải báo cáo:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const salesColumns = [
    {
      title: 'Thời Gian',
      dataIndex: 'period',
      key: 'period',
    },
    {
      title: 'Đơn Hàng',
      dataIndex: 'orders',
      key: 'orders',
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'total',
      key: 'revenue',
      render: (value: number) => <span style={{ fontWeight: 600 }}>{formatCurrency(value)}</span>,
    },
    {
      title: 'Giảm Giá',
      dataIndex: 'discount',
      key: 'discount',
      render: (value: number) => <span style={{ color: '#ef4444' }}>-{formatCurrency(value)}</span>,
    },
  ];

  const productColumns = [
    {
      title: 'Sản Phẩm',
      dataIndex: 'product_name',
      key: 'product',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Đã Bán',
      dataIndex: 'total_quantity',
      key: 'quantity',
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Doanh Thu',
      dataIndex: 'total_revenue',
      key: 'revenue',
      render: (value: number) => <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatCurrency(value)}</span>,
    },
  ];

  const customerColumns = [
    {
      title: 'Khách Hàng',
      dataIndex: 'full_name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 500 }}>{name}</span>,
    },
    {
      title: 'Điện Thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Đơn Hàng',
      dataIndex: 'order_count',
      key: 'orders',
    },
    {
      title: 'Tổng Chi Tiêu',
      dataIndex: 'total_spent',
      key: 'spent',
      render: (value: number) => <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatCurrency(value)}</span>,
    },
    {
      title: 'Hạng',
      dataIndex: 'loyalty_tier',
      key: 'tier',
    },
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Đang tải...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#0f172a' }}>
        Báo Cáo
      </h1>

      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="Tổng Quan Doanh Thu" style={{ borderRadius: 12, border: '1px solid #f1f5f9' }} headStyle={{ fontWeight: 600 }}>
            <Row gutter={16}>
              <Col span={6}>
                <StatCard
                  title="Tổng Doanh Thu"
                  value={formatCurrency(salesData?.summary?.total_revenue || 0)}
                  color="#10b981"
                />
              </Col>
              <Col span={6}>
                <StatCard
                  title="Tổng Đơn Hàng"
                  value={salesData?.summary?.total_orders || 0}
                  color="#3b82f6"
                />
              </Col>
              <Col span={6}>
                <StatCard
                  title="Giá Trị TB Đơn Hàng"
                  value={formatCurrency(salesData?.summary?.avg_order_value || 0)}
                  color="#7c3aed"
                />
              </Col>
              <Col span={6}>
                <StatCard
                  title="Tổng Giảm Giá"
                  value={formatCurrency(salesData?.summary?.total_discount || 0)}
                  color="#ef4444"
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title="Doanh Thu Theo Thời Gian" style={{ borderRadius: 12, border: '1px solid #f1f5f9' }} headStyle={{ fontWeight: 600 }}>
            <Table
              columns={salesColumns}
              dataSource={salesData?.sales_by_period || []}
              rowKey="period"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={12}>
          <Card title="Sản Phẩm Bán Chạy" style={{ borderRadius: 12, border: '1px solid #f1f5f9' }} headStyle={{ fontWeight: 600 }}>
            <Table
              columns={productColumns}
              dataSource={productData?.top_products || []}
              rowKey="product_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Khách Hàng Hàng Đầu" style={{ borderRadius: 12, border: '1px solid #f1f5f9' }} headStyle={{ fontWeight: 600 }}>
            <Table
              columns={customerColumns}
              dataSource={customerData?.top_customers || []}
              rowKey="id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default ReportsPage;
