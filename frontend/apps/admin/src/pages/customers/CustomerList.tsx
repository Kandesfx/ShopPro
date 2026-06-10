import React, { useEffect, useState } from 'react';
import { Table, Card, Tag, Input, Select } from 'antd';
import { customersApi } from '../../api/client';

const { Search } = Input;

const TYPE_LABELS: Record<string, string> = {
  regular: 'Thường',
  vip: 'VIP',
  wholesale: 'Sỉ',
};

const TIER_LABELS: Record<string, string> = {
  platinum: 'Bạch Kim',
  gold: 'Vàng',
  silver: 'Bạc',
  bronze: 'Đồng',
};

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });

  const fetchCustomers = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await customersApi.getAll({ page, limit: pageSize });
      if (response.data.success) {
        setCustomers(response.data.data);
        setPagination({
          current: response.data.pagination.page,
          pageSize,
          total: response.data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải khách hàng:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchCustomers(newPagination.current, newPagination.pageSize);
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
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Họ và Tên',
      dataIndex: 'full_name',
      key: 'name',
      render: (name: string) => <span style={{ fontWeight: 600 }}>{name}</span>,
    },
    {
      title: 'Điện Thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Loại',
      dataIndex: 'customer_type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'vip' ? 'gold' : type === 'wholesale' ? 'purple' : 'default'}>
          {TYPE_LABELS[type] || type}
        </Tag>
      ),
    },
    {
      title: 'Hạng',
      dataIndex: 'loyalty_tier',
      key: 'tier',
      render: (tier: string) => {
        const colors: Record<string, string> = {
          platinum: '#94a3b8',
          gold: 'gold',
          silver: '#c0c0c0',
          bronze: '#cd7f32',
        };
        return (
          <Tag color={colors[tier] || 'default'}>
            {TIER_LABELS[tier] || tier}
          </Tag>
        );
      },
    },
    {
      title: 'Tổng Chi Tiêu',
      dataIndex: 'total_spent',
      key: 'spent',
      render: (value: number) => (
        <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatCurrency(value)}</span>
      ),
    },
    {
      title: 'Đơn Hàng',
      dataIndex: 'total_orders',
      key: 'orders',
    },
    {
      title: 'Điểm',
      dataIndex: 'loyalty_points',
      key: 'points',
    },
    {
      title: 'Ngày Tham Gia',
      dataIndex: 'created_at',
      key: 'joined',
      render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
    },
  ];

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
        Khách Hàng
      </h1>

      <Card style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Search placeholder="Tìm kiếm khách hàng..." style={{ width: 300 }} />
          <Select
            placeholder="Loại khách hàng"
            style={{ width: 180 }}
            allowClear
            options={[
              { label: 'Thường', value: 'regular' },
              { label: 'VIP', value: 'vip' },
              { label: 'Sỉ', value: 'wholesale' },
            ]}
          />
          <Select
            placeholder="Hạng thành viên"
            style={{ width: 180 }}
            allowClear
            options={[
              { label: 'Đồng', value: 'bronze' },
              { label: 'Bạc', value: 'silver' },
              { label: 'Vàng', value: 'gold' },
              { label: 'Bạch Kim', value: 'platinum' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={customers}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
}

export default CustomerList;
