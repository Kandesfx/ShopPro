import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Tag, Input, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { productsApi, categoriesApi } from '../../api/client';

const { Search } = Input;

const STATUS_LABELS: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  draft: 'Nháp',
  discontinued: 'Ngừng kinh doanh',
};

export function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 });
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll();
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải danh mục:', error);
    }
  };

  const fetchProducts = async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const response = await productsApi.getAll({ page, limit: pageSize });
      if (response.data.success) {
        setProducts(response.data.data);
        setPagination({
          current: response.data.pagination.page,
          pageSize,
          total: response.data.pagination.total,
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleTableChange = (newPagination: any) => {
    fetchProducts(newPagination.current, newPagination.pageSize);
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
      title: 'Hình Ảnh',
      dataIndex: 'images',
      key: 'image',
      width: 80,
      render: (images: string | null) => {
        if (!images) return '-';
        try {
          const parsed = JSON.parse(images);
          return (
            <img
              src={parsed[0]}
              alt="product"
              style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }}
            />
          );
        } catch {
          return '-';
        }
      },
    },
    {
      title: 'Tên Sản Phẩm',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: any) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{record.sku}</div>
        </div>
      ),
    },
    {
      title: 'Danh Mục',
      dataIndex: 'category_name',
      key: 'category',
    },
    {
      title: 'Thương Hiệu',
      dataIndex: 'brand_name',
      key: 'brand',
    },
    {
      title: 'Giá Bán',
      dataIndex: 'retail_price',
      key: 'price',
      render: (price: number) => (
        <span style={{ fontWeight: 600, color: '#2563eb' }}>{formatCurrency(price)}</span>
      ),
    },
    {
      title: 'Tồn Kho',
      key: 'stock',
      render: (_: any, record: any) => (
        <span style={{ color: record.total_stock > 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>
          {record.total_stock || 0}
        </span>
      ),
    },
    {
      title: 'Trạng Thái',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          active: 'green',
          inactive: 'default',
          draft: 'orange',
          discontinued: 'red',
        };
        return (
          <Tag color={colors[status]} style={{ borderRadius: 20, fontWeight: 500 }}>
            {STATUS_LABELS[status] || status}
          </Tag>
        );
      },
    },
    {
      title: 'Thao Tác',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/products/${record.id}/edit`)}
          />
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: '#0f172a' }}>
          Sản Phẩm
        </h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/products/new')}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Thêm Sản Phẩm
        </Button>
      </div>

      <Card style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
        <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
          <Search
            placeholder="Tìm kiếm sản phẩm..."
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
          />
        </div>

        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
          style={{ borderRadius: 8 }}
        />
      </Card>
    </div>
  );
}

export default ProductList;
