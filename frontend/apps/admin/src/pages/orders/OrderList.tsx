import React, { useEffect, useState } from 'react';
import { Table, Tag, Space, Button, Input, Select, Card, Modal, message } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import { ordersApi } from '../../api/client';

const { Search } = Input;

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao hàng',
  delivered: 'Đã giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  returned: 'Trả hàng',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'gold',
  confirmed: 'blue',
  processing: 'purple',
  shipped: 'cyan',
  delivered: 'green',
  completed: 'green',
  cancelled: 'red',
  returned: 'default',
};

const STATUS_OPTIONS = [
  { label: 'Chờ xác nhận', value: 'pending' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đang xử lý', value: 'processing' },
  { label: 'Đang giao hàng', value: 'shipped' },
  { label: 'Hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
];

export function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  const fetchOrders = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await ordersApi.getAll({ page, limit: pageSize });
      if (response.data.success) {
        setOrders(response.data.data);
        setPagination({
          current: response.data.pagination.page,
          pageSize,
          total: response.data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải đơn hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchOrders(newPagination.current, newPagination.pageSize);
  };

  const handleViewOrder = async (id: number) => {
    try {
      const response = await ordersApi.getById(id);
      if (response.data.success) {
        setSelectedOrder(response.data.data);
        setOrderModalVisible(true);
      }
    } catch (error) {
      message.error('Không thể tải chi tiết đơn hàng');
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await ordersApi.updateStatus(id, { status });
      message.success('Cập nhật trạng thái thành công');
      fetchOrders(pagination.current, pagination.pageSize);
      setOrderModalVisible(false);
    } catch (error) {
      message.error('Cập nhật trạng thái thất bại');
    }
  };

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
      key: 'customer',
      render: (name: string | null, record: any) => name || record.shipping_full_name || 'Khách vãng lai',
    },
    {
      title: 'Sản Phẩm',
      key: 'items_count',
      render: (_: any, record: any) => record.items?.length || 0,
    },
    {
      title: 'Tổng Tiền',
      dataIndex: 'total_amount',
      key: 'total',
      render: (value: number) => (
        <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Thanh Toán',
      dataIndex: 'payment_method',
      key: 'payment',
      render: (method: string) => method.toUpperCase(),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status]} style={{ borderRadius: 20, fontWeight: 500 }}>
          {STATUS_LABELS[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Ngày',
      dataIndex: 'ordered_at',
      key: 'date',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleViewOrder(record.id)}
        >
          Xem
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
        Đơn Hàng
      </h1>

      <Card style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Search placeholder="Tìm kiếm đơn hàng..." style={{ width: 300 }} />
          <Select
            placeholder="Trạng thái"
            style={{ width: 180 }}
            allowClear
            options={STATUS_OPTIONS}
          />
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={<span style={{ fontWeight: 700 }}>Đơn hàng #{selectedOrder?.order_number}</span>}
        open={orderModalVisible}
        onCancel={() => setOrderModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedOrder && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p><strong>Trạng thái:</strong> <Tag color={STATUS_COLORS[selectedOrder.status]}>{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</Tag></p>
              <p><strong>Khách hàng:</strong> {selectedOrder.customer_name || selectedOrder.shipping_full_name}</p>
              <p><strong>Điện thoại:</strong> {selectedOrder.customer_phone || selectedOrder.shipping_phone}</p>
              <p><strong>Địa chỉ:</strong> {selectedOrder.shipping_address}</p>
            </div>

            <h4 style={{ fontWeight: 600, marginBottom: 12 }}>Sản phẩm trong đơn</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <th style={{ textAlign: 'left', padding: 8, color: '#64748b' }}>Sản phẩm</th>
                  <th style={{ textAlign: 'center', padding: 8, color: '#64748b' }}>SL</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#64748b' }}>Đơn giá</th>
                  <th style={{ textAlign: 'right', padding: 8, color: '#64748b' }}>Tổng</th>
                </tr>
              </thead>
              <tbody>
                {selectedOrder.items?.map((item: any, index: number) => (
                  <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: 8 }}>
                      <div style={{ fontWeight: 500, color: '#0f172a' }}>{item.product_name}</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>SKU: {item.sku}</div>
                    </td>
                    <td style={{ textAlign: 'center', padding: 8, fontWeight: 500 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', padding: 8 }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: 'right', padding: 8, fontWeight: 600 }}>{formatCurrency(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <p>Tạm tính: {formatCurrency(selectedOrder.subtotal)}</p>
              <p>Giảm giá: -{formatCurrency(selectedOrder.discount_amount)}</p>
              <p>Thuế: {formatCurrency(selectedOrder.tax_amount)}</p>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#2563eb' }}>
                Tổng cộng: {formatCurrency(selectedOrder.total_amount)}
              </p>
            </div>

            <Space>
              {selectedOrder.status === 'pending' && (
                <Button type="primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')}>
                  Xác Nhận Đơn
                </Button>
              )}
              {selectedOrder.status === 'confirmed' && (
                <Button type="primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')}>
                  Bắt Đầu Xử Lý
                </Button>
              )}
              {selectedOrder.status === 'processing' && (
                <Button type="primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')}>
                  Đánh Dấu Đã Giao
                </Button>
              )}
              {selectedOrder.status === 'shipped' && (
                <Button type="primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')}>
                  Xác Nhận Đã Nhận
                </Button>
              )}
              {selectedOrder.status === 'delivered' && (
                <Button type="primary" onClick={() => handleUpdateStatus(selectedOrder.id, 'completed')}>
                  Hoàn Thành Đơn
                </Button>
              )}
            </Space>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default OrderList;
