import React from 'react';
import { Layout, Menu, Dropdown, Avatar, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  InboxOutlined,
  BarChartOutlined,
  LogoutOutlined,
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;

export function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Tổng Quan',
    },
    {
      key: '/products',
      icon: <ShoppingOutlined />,
      label: 'Sản Phẩm',
    },
    {
      key: '/orders',
      icon: <ShoppingCartOutlined />,
      label: 'Đơn Hàng',
    },
    {
      key: '/inventory',
      icon: <InboxOutlined />,
      label: 'Kho Hàng',
    },
    {
      key: '/customers',
      icon: <UserOutlined />,
      label: 'Khách Hàng',
    },
    {
      key: '/reports',
      icon: <BarChartOutlined />,
      label: 'Báo Cáo',
    },
  ];

  const userMenuItems = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng Xuất',
    },
  ];

  const handleMenuClick = (key: string) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      localStorage.removeItem('accessToken');
      navigate('/login');
    }
  };

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        width={240}
        style={{
          background: '#0f172a',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            fontWeight: 'bold',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            letterSpacing: '-0.02em',
          }}
        >
          ShopPro Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => handleMenuClick(key)}
          style={{
            borderRight: 0,
            background: 'transparent',
            marginTop: 8,
          }}
        />
      </Sider>
      <Layout style={{ marginLeft: 240 }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            borderBottom: '1px solid #f1f5f9',
          }}
        >
          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenuClick }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer', color: '#334155' }}>
              <Avatar
                style={{ backgroundColor: '#3b82f6' }}
                icon={<UserOutlined />}
              />
              <span style={{ fontWeight: 500 }}>Quản trị viên</span>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24, background: '#f8fafc', minHeight: 280 }}>
          <div style={{ padding: 24, minHeight: 360 }}>
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminLayout;
