# Hướng Dẫn Cài Đặt & Chạy ShopPro

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Cài đặt nhanh (Khuyến nghị)](#2-cài-đặt-nhanh)
3. [Chạy từng thành phần riêng lẻ](#3-chạy-từng-thành-phần-riêng-lẻ)
4. [Xác minh hệ thống hoạt động](#4-xác-minh-hệ-thống-hoạt-động)
5. [Tài khoản demo](#5-tài-khoản-demo)
6. [Xử lý sự cố](#6-xử-lý-sự-cố)

---

## 1. Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu |
|----------|---------------------|
| Node.js  | v18.0.0 trở lên    |
| npm      | v9.0.0 trở lên     |
| Git      | Bất kỳ phiên bản nào |
| Docker *(tùy chọn)* | Docker Desktop |

Kiểm tra phiên bản hiện tại:

```bash
node --version
npm --version
```

---

## 2. Cài đặt nhanh

### Bước 1: Clone & cài đặt dependencies

```bash
# Di chuyển vào thư mục dự án
cd shoppro

# Cài đặt dependencies cho backend
cd backend && npm install && cd ..

# Cài đặt dependencies cho frontend (tất cả apps cùng lúc)
cd frontend && npm install && cd ..
```

### Bước 2: Khởi động Backend

```bash
cd backend
npm run dev
```

Backend sẽ chạy tại **http://localhost:3001**. Database SQLite sẽ được tạo tự động tại `backend/data/shoppro.db`.

### Bước 3: Khởi động Frontend

Mở **terminal mới**, chạy một hoặc nhiều app:

```bash
# Website (bán hàng online)
cd frontend
npm run dev:website

# Admin Dashboard (quản trị)
cd frontend
npm run dev:admin

# POS (bán hàng tại quầy)
cd frontend
npm run dev:pos
```

### Bước 4: Mở trình duyệt

| Ứng dụng | URL |
|-----------|-----|
| Website   | http://localhost:3002 |
| Admin     | http://localhost:5174 |
| POS       | http://localhost:5175 |

---

## 3. Chạy từng thành phần riêng lẻ

### 3.1. Backend

```bash
cd shoppro/backend

# Cài đặt (nếu chưa có node_modules)
npm install

# Khởi chạy chế độ development (auto-reload)
npm run dev

# Hoặc build và chạy production
npm run build
npm run start
```

### 3.2. Website (Next.js)

```bash
cd shoppro/frontend

# Cài đặt (đã có sẵn nếu đã chạy bước 2)
npm install

# Chạy development server
npm run dev:website
```

### 3.3. Admin Dashboard (Vite + React)

```bash
cd shoppro/frontend

# Chạy development server
npm run dev:admin
```

### 3.4. POS (Vite + React)

```bash
cd shoppro/frontend

# Chạy development server
npm run dev:pos
```

### 3.5. Docker *(tùy chọn)*

Chạy database PostgreSQL và Redis qua Docker:

```bash
cd shoppro
docker compose up -d
```

Xem trạng thái container:

```bash
docker compose ps
```

---

## 4. Xác minh hệ thống hoạt động

### Kiểm tra Backend API

```bash
curl http://localhost:3001/api/health
```

Kết quả mong đợi:

```json
{
  "success": true,
  "message": "ShopPro API is running",
  "version": "1.0.0"
}
```

### Kiểm tra các endpoint khác

| API | Method | Mô tả |
|-----|--------|-------|
| `/api/health` | GET | Health check |
| `/api/auth/login` | POST | Đăng nhập |
| `/api/products` | GET | Danh sách sản phẩm |
| `/api/categories` | GET | Danh mục sản phẩm |

---

## 5. Tài khoản demo

Sau khi backend khởi động lần đầu, dữ liệu mẫu sẽ được tạo tự động. Đăng nhập vào Website, Admin, hoặc POS bằng các tài khoản sau:

| Vai trò  | Tài khoản  | Mật khẩu   |
|----------|------------|-------------|
| Admin    | admin      | admin123    |
| Manager  | manager    | staff123    |
| Staff    | staff      | staff123    |

---

## 6. Xử lý sự cố

### Lỗi `EADDRINUSE` (Port đã được sử dụng)

Kiểm tra và tắt process đang chiếm port:

```powershell
# Windows: tìm process sử dụng port
netstat -ano | findstr ":3001"

# Tắt process theo PID
taskkill /PID <PID> /F
```

### Lỗi `node_modules` thiếu

```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install
```

### Lỗi SQLite database bị lỗi

Xóa file database cũ và khởi động lại backend:

```bash
# Dùng cmd
del backend\data\shoppro.db

# Hoặc PowerShell
Remove-Item backend\data\shoppro.db

# Sau đó chạy lại backend
cd backend && npm run dev
```

### Website không kết nối được Backend

Kiểm tra backend đang chạy trên port 3001:

```bash
curl http://localhost:3001/api/health
```

Kiểm tra file `frontend/apps/website/next.config.js` đã cấu hình proxy đúng chưa.

### Docker container không khởi động

```bash
# Xem log lỗi
docker compose logs postgres
docker compose logs redis

# Restart
docker compose restart
```

---

## Cấu trúc thư mục nhanh

```
shoppro/
├── backend/                    # Node.js + Express API
│   ├── src/
│   │   ├── controllers/        # Xử lý request
│   │   ├── services/          # Logic nghiệp vụ
│   │   ├── routes/            # Định nghĩa API routes
│   │   ├── middleware/        # Auth, validation
│   │   ├── db/                # Database setup & migrations
│   │   └── index.ts           # Entry point
│   ├── data/                  # SQLite database file
│   └── package.json
│
├── frontend/
│   ├── apps/
│   │   ├── website/           # Next.js — bán hàng online
│   │   ├── admin/            # Vite + React — trang quản trị
│   │   └── pos/               # Vite + React — bán hàng tại quầy
│   └── packages/
│       └── ui/                # Thư viện UI dùng chung
│
├── docker/                    # Docker configuration
└── docker-compose.yml         # PostgreSQL + Redis
```
