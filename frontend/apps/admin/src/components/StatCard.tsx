import React from 'react';
import { Card } from 'antd';

interface StatCardProps {
  title: string;
  value: string | number;
  prefix?: React.ReactNode;
  suffix?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: string;
}

export function StatCard({ title, value, prefix, suffix, trend, icon, color = '#3b82f6' }: StatCardProps) {
  return (
    <Card
      style={{
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        border: '1px solid #f1f5f9',
      }}
      bodyStyle={{ padding: 20 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>{title}</p>
          <p style={{ fontSize: 26, fontWeight: 700, margin: 0, color: '#0f172a' }}>
            {prefix}
            {value}
            {suffix}
          </p>
          {trend && (
            <p style={{
              color: trend.isPositive ? '#10b981' : '#ef4444',
              fontSize: 13,
              marginTop: 8,
              fontWeight: 500,
            }}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% so với tháng trước
            </p>
          )}
        </div>
        {icon && (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              background: `${color}12`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              color: color,
            }}
          >
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
