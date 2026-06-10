import React from 'react';
import { Menu } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  InboxOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

export function Sidebar({ collapsed }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const items = [
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

  const selectedKey = '/' + location.pathname.split('/')[1];

  return (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[selectedKey]}
      items={items}
      onClick={({ key }) => navigate(key)}
      style={{ background: 'transparent', borderRight: 0 }}
    />
  );
}

interface SidebarProps {
  collapsed: boolean;
}

export default Sidebar;
