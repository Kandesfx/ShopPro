import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Button, Modal, Form, InputNumber, Select, message } from 'antd';
import { WarningOutlined } from '@ant-design/icons';
import { inventoryApi } from '../../api/client';

const STOCK_STATUS_LABELS: Record<string, string> = {
  'in-stock': 'Còn Hàng',
  'low-stock': 'Sắp Hết',
  'out-of-stock': 'Hết Hàng',
};

const REASON_OPTIONS = [
  { label: 'Nhập Kho Mới', value: 'stock_import' },
  { label: 'Điều Chỉnh Tồn Kho', value: 'stock_adjustment' },
  { label: 'Trả Hàng', value: 'return' },
  { label: 'Hàng Hỏng', value: 'damaged' },
  { label: 'Lý Do Khác', value: 'other' },
];

export function InventoryPage() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [adjustModalVisible, setAdjustModalVisible] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [adjustForm] = Form.useForm();

  const fetchInventory = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await inventoryApi.getAll({ page, limit: pageSize });
      if (response.data.success) {
        setInventory(response.data.data);
        setPagination({
          current: response.data.pagination.page,
          pageSize,
          total: response.data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải kho hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchInventory(newPagination.current, newPagination.pageSize);
  };

  const handleAdjust = (record: any) => {
    setSelectedVariant(record);
    adjustForm.resetFields();
    setAdjustModalVisible(true);
  };

  const handleAdjustSubmit = async (values: { quantity_change: number; reason: string }) => {
    try {
      await inventoryApi.adjust({
        variant_id: selectedVariant.variant_id,
        ...values,
      });
      message.success('Điều chỉnh kho thành công');
      setAdjustModalVisible(false);
      fetchInventory(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('Điều chỉnh kho thất bại');
    }
  };

  const columns = [
    {
      title: 'SKU',
      dataIndex: 'sku',
      key: 'sku',
    },
    {
      title: 'Sản Phẩm',
      dataIndex: 'product_name',
      key: 'product',
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {record.size && `Size: ${record.size}`}
            {record.size && record.color && ' | '}
            {record.color && `Màu: ${record.color}`}
          </div>
        </div>
      ),
    },
    {
      title: 'Còn Lại',
      dataIndex: 'available_stock',
      key: 'available',
      render: (stock: number) => (
        <span style={{ fontWeight: 700, color: stock > 0 ? '#10b981' : '#ef4444', fontSize: 15 }}>
          {stock}
        </span>
      ),
    },
    {
      title: 'Đã Đặt',
      dataIndex: 'reserved',
      key: 'reserved',
    },
    {
      title: 'Tổng',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span>,
    },
    {
      title: 'Trạng Thái',
      key: 'status',
      render: (_: any, record: any) => {
        if (record.available_stock === 0) {
          return <Tag color="error" style={{ borderRadius: 20 }}>Hết Hàng</Tag>;
        }
        if (record.quantity <= record.min_stock_level) {
          return <Tag color="warning" style={{ borderRadius: 20 }}>Sắp Hết</Tag>;
        }
        return <Tag color="success" style={{ borderRadius: 20 }}>Còn Hàng</Tag>;
      },
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button onClick={() => handleAdjust(record)} type="primary" size="small" style={{ borderRadius: 8 }}>
          Điều Chỉnh
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
        Kho Hàng
      </h1>

      <Card style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
        <Table
          columns={columns}
          dataSource={inventory}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={<span style={{ fontWeight: 700 }}>Điều Chỉnh Kho Hàng</span>}
        open={adjustModalVisible}
        onCancel={() => setAdjustModalVisible(false)}
        footer={null}
      >
        {selectedVariant && (
          <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8 }}>
            <p style={{ fontWeight: 600, color: '#0f172a' }}>{selectedVariant.product_name}</p>
            <p style={{ color: '#64748b', fontSize: 13 }}>
              {selectedVariant.size && `Size: ${selectedVariant.size}`}
              {selectedVariant.color && ` | Màu: ${selectedVariant.color}`}
            </p>
            <p style={{ color: '#334155', fontSize: 13 }}>
              Tồn kho hiện tại: <strong>{selectedVariant.quantity}</strong>
            </p>
          </div>
        )}

        <Form form={adjustForm} layout="vertical" onFinish={handleAdjustSubmit}>
          <Form.Item
            name="quantity_change"
            label="Thay Đổi Số Lượng"
            rules={[{ required: true, message: 'Vui lòng nhập số lượng thay đổi' }]}
          >
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Dùng số âm để giảm tồn kho"
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý Do"
            rules={[{ required: true, message: 'Vui lòng chọn lý do' }]}
          >
            <Select options={REASON_OPTIONS} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block style={{ borderRadius: 8 }}>
              Xác Nhận Điều Chỉnh
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

export default InventoryPage;
