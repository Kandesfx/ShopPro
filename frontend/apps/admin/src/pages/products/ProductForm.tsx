import React, { useEffect, useState } from 'react';
import { Form, Input, InputNumber, Select, Button, Card, message, Space } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { productsApi, categoriesApi } from '../../api/client';

const { TextArea } = Input;

const STATUS_OPTIONS = [
  { label: 'Hoạt động', value: 'active' },
  { label: 'Không hoạt động', value: 'inactive' },
  { label: 'Nháp', value: 'draft' },
  { label: 'Ngừng kinh doanh', value: 'discontinued' },
];

export function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!id);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  const isEditing = !!id;

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    if (id) {
      fetchProduct();
    }
  }, [id]);

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

  const fetchBrands = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/categories/brands');
      const data = await response.json();
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải thương hiệu:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await productsApi.getById(Number(id));
      if (response.data.success) {
        const product = response.data.data;
        form.setFieldsValue({
          name: product.name,
          description: product.description,
          category_id: product.category_id,
          brand_id: product.brand_id,
          cost_price: product.cost_price,
          retail_price: product.retail_price,
          wholesale_price: product.wholesale_price,
          weight: product.weight,
          status: product.status,
        });
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
      message.error('Không thể tải sản phẩm');
    } finally {
      setInitialLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      if (isEditing) {
        await productsApi.update(Number(id), values);
        message.success('Cập nhật sản phẩm thành công');
      } else {
        await productsApi.create(values);
        message.success('Tạo sản phẩm mới thành công');
      }
      navigate('/products');
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <div style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Đang tải...</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>
        {isEditing ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Sản Phẩm Mới'}
      </h1>

      <Card style={{ borderRadius: 12, border: '1px solid #f1f5f9' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            status: 'draft',
            cost_price: 0,
            retail_price: 0,
            wholesale_price: 0,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              label="Tên Sản Phẩm"
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên sản phẩm' }]}
            >
              <Input placeholder="Nhập tên sản phẩm" size="large" style={{ borderRadius: 8 }} />
            </Form.Item>

            <Form.Item label="SKU" name="sku">
              <Input placeholder="Tự động tạo nếu bỏ trống" size="large" disabled style={{ borderRadius: 8 }} />
            </Form.Item>
          </div>

          <Form.Item label="Mô Tả" name="description">
            <TextArea rows={4} placeholder="Nhập mô tả sản phẩm" style={{ borderRadius: 8 }} />
          </Form.Item>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Danh Mục" name="category_id">
              <Select
                placeholder="Chọn danh mục"
                options={categories.map((c: any) => ({ label: c.name, value: c.id }))}
                allowClear
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>

            <Form.Item label="Thương Hiệu" name="brand_id">
              <Select
                placeholder="Chọn thương hiệu"
                options={brands.map((b: any) => ({ label: b.name, value: b.id }))}
                allowClear
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Form.Item
              label="Giá Nhập"
              name="cost_price"
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <InputNumber
                style={{ width: '100%', borderRadius: 8 }}
                min={0}
                size="large"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
              />
            </Form.Item>

            <Form.Item
              label="Giá Bán Lẻ"
              name="retail_price"
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <InputNumber
                style={{ width: '100%', borderRadius: 8 }}
                min={0}
                size="large"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
              />
            </Form.Item>

            <Form.Item
              label="Giá Sỉ"
              name="wholesale_price"
              rules={[{ required: true, message: 'Bắt buộc' }]}
            >
              <InputNumber
                style={{ width: '100%', borderRadius: 8 }}
                min={0}
                size="large"
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/,/g, '') || 0) as any}
              />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item label="Trọng Lượng (g)" name="weight">
              <InputNumber style={{ width: '100%', borderRadius: 8 }} min={0} size="large" />
            </Form.Item>

            <Form.Item label="Trạng Thái" name="status">
              <Select
                options={STATUS_OPTIONS}
                size="large"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </div>

          <Form.Item style={{ marginBottom: 0 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large" style={{ borderRadius: 8, fontWeight: 600 }}>
                {isEditing ? 'Cập Nhật' : 'Tạo Sản Phẩm'}
              </Button>
              <Button onClick={() => navigate('/products')} size="large" style={{ borderRadius: 8 }}>
                Hủy
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

export default ProductForm;
