'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@shoppro/ui';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login(formData);
      if (res.success) {
        setAuth(res.data.user, res.data.accessToken);
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-extrabold text-blue-600">
            ShopPro
          </Link>
          <p className="text-slate-500 mt-2">Đăng nhập vào tài khoản của bạn</p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tài Khoản</label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
              placeholder="Nhập tài khoản hoặc email"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Mật Khẩu</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800"
              placeholder="Nhập mật khẩu"
            />
          </div>

          <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
            Đăng Nhập
          </Button>
        </form>

        <p className="mt-6 text-center text-slate-600 text-sm">
          Chưa có tài khoản?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
            Đăng ký ngay
          </Link>
        </p>

        <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs text-slate-500 text-center mb-2 font-semibold">Tài Khoản Demo:</p>
          <div className="text-sm text-slate-600 space-y-1">
            <p><strong>Quản trị:</strong> admin / admin123</p>
            <p><strong>Nhân viên:</strong> staff / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
