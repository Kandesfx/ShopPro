# ShopPro — Hệ Thống Quản Lý Bán Giày (Offline + Online)

> Đồ án môn **Phân Tích Thiết Kế Hệ Thống Thông Tin** — Shop quản lý bán giày tích hợp cửa hàng (POS) và online.

---

## 1. Tổng Quan Dự Án

**ShopPro** là hệ thống quản lý bán hàng toàn diện dành cho cửa hàng giày, hỗ trợ đồng thời:

| Kênh | Mô tả |
|-------|--------|
| **POS** | Bán hàng tại quầy — quét mã vạch, in hóa đơn 80mm/58mm, tiền mặt/chuyển khoản |
| **Website** | Bán hàng online — giỏ hàng, thanh toán VNPay/MoMo/COD, theo dõi vận chuyển |
| **Admin** | Trang quản trị — sản phẩm, kho, nhân viên, khách hàng, báo cáo |

---

## 2. Cấu Trúc Tài Liệu

```
THPTTKHT/
│
├── 1-Tai-lieu/
│   └── 1.SPEC.md           ← Đặc tả yêu cầu tổng quan (System Overview)
│
├── 2-Phan-tich/
│   ├── 1.SRS.md            ← Đặc tả yêu cầu chi tiết (Functional + Non-functional)
│   └── 2.SAD.md            ← Phân tích nghiệp vụ (Use Cases + Business Rules)
│
├── 3-Thiet-ke/
│   ├── 1.SDD.md            ← Thiết kế kiến trúc hệ thống (Architecture + Services)
│   ├── 2.Database-Design.md ← Thiết kế CSDL (ERD + Tables + Indexes)
│   └── 3.UI-Design.md      ← Thiết kế giao diện (Wireframes + Components)
│
├── 4-Kien-truc/
│   └── Deployment.md       ← Kiến trúc triển khai (Docker + CI/CD + Security)
│
└── README.md               ← (file này)
```

---

## 3. Sơ Đồ Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    SHOPPRO ECOSYSTEM                        │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐            │
│  │  Website  │  │   POS    │  │ Admin Portal │            │
│  │ (Customer)│  │  (Staff) │  │  (Manager)  │            │
│  │ Next.js   │  │  React   │  │   React     │            │
│  └─────┬────┘  └────┬─────┘  └──────┬───────┘            │
│        │             │                │                     │
│        └─────────────┼────────────────┘                     │
│                      │                                      │
│              ┌──────▼──────┐                               │
│              │  API Gateway │ (Kong/Nginx)                  │
│              └──────┬──────┘                               │
│     ┌───────────────┼───────────────┐                     │
│     │               │               │                       │
│ ┌───▼───┐    ┌─────▼─────┐  ┌─────▼─────┐               │
│ │ Auth   │    │  Order    │  │  Product  │               │
│ │ Service│    │  Service  │  │  Service  │               │
│ └───────┘    └─────┬─────┘  └───────────┘               │
│                     │                                     │
│     ┌───────────────┼────────────────────┐               │
│     │               │                    │               │
│ ┌───▼──────┐ ┌─────▼──────┐ ┌─────────▼──────┐         │
│ │ Inventory│ │  Payment   │ │  Notification │         │
│ │ Service  │ │  Service   │ │   Service     │         │
│ └──────────┘ └────────────┘ └───────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │         PostgreSQL  │  Redis  │  RabbitMQ         │  │
│  └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Các Module Chính

| Module | Mô tả | Người dùng |
|--------|--------|-----------|
| **Đăng nhập/Phân quyền** | Xác thực JWT, RBAC | Tất cả |
| **Quản lý sản phẩm** | CRUD sản phẩm, biến thể (size/màu), SKU | Admin, Manager |
| **Quản lý kho** | Nhập kho, xuất kho, kiểm kê, cảnh báo | Manager, Warehouse |
| **Bán hàng POS** | Tạo đơn, thanh toán, in hóa đơn | Cashier |
| **Bán hàng Online** | Giỏ hàng, đặt hàng, thanh toán | Customer |
| **Thanh toán** | Tiền mặt, chuyển khoản, VNPay, MoMo, COD | All |
| **Vận chuyển** | GHTK, GHN, VNPost, tracking | Staff, Customer |
| **CRM** | Khách hàng, tích điểm, VIP, điểm thưởng | Admin, Manager |
| **Khuyến mãi** | Mã giảm giá, flash sale, bundle, freeship | Admin |
| **Báo cáo** | Doanh thu, tồn kho, nhân viên, khách hàng | Manager, Accountant |

---

## 5. Công Nghệ Sử Dụng

| Tầng | Công nghệ |
|------|-----------|
| Frontend (Website) | Next.js 14, TailwindCSS |
| Frontend (POS/Admin) | React 18, Ant Design 5 |
| Backend API | Node.js + Express, Prisma ORM |
| Database | PostgreSQL 16 |
| Cache | Redis 7 |
| Message Queue | RabbitMQ |
| File Storage | MinIO (S3-compatible) |
| Container | Docker |
| CI/CD | GitHub Actions |

---

## 6. Quy Trình Nghiệp Vụ Chính

### Bán hàng POS
```
Tìm sản phẩm → Chọn size/màu → Thêm vào giỏ → Thanh toán → In hóa đơn → Cập nhật tồn kho
```

### Bán hàng Online
```
Đăng ký/Đăng nhập → Xem sản phẩm → Thêm giỏ hàng → Đặt hàng → Thanh toán → Xác nhận → Giao hàng → Hoàn thành
```

### Nhập kho
```
Tạo đơn nhập → Duyệt đơn → Nhận hàng → Cập nhật tồn kho → Ghi nhận công nợ
```

---

## 7. Các Tài Liệu Chi Tiết

| # | Tài liệu | Mô tả |
|---|----------|--------|
| 1 | `1-Tai-lieu/1.SPEC.md` | Đặc tả yêu cầu tổng quan, mục tiêu, phạm vi |
| 2 | `2-Phan-tich/1.SRS.md` | Đặc tả yêu cầu chi tiết, tất cả chức năng |
| 3 | `2-Phan-tich/2.SAD.md` | Phân tích nghiệp vụ, use case, quy tắc nghiệp vụ |
| 4 | `3-Thiet-ke/1.SDD.md` | Thiết kế kiến trúc, microservices, API endpoints |
| 5 | `3-Thiet-ke/2.Database-Design.md` | ERD, 20+ bảng, ràng buộc, index |
| 6 | `3-Thiet-ke/3.UI-Design.md` | Wireframes, component, responsive, color system |
| 7 | `4-Kien-truc/Deployment.md` | Docker, CI/CD, security, backup |

---

## 8. Thông Tin Đồ Án

| Thông tin | Chi tiết |
|-----------|----------|
| **Môn học** | Phân Tích Thiết Kế Hệ Thống Thông Tin |
| **Đề tài** | Hệ thống quản lý bán giày ShopPro |
| **Phiên bản** | 1.0 |
| **Ngày hoàn thành** | 2026-06-09 |
| **Tác giả** | Sinh viên |

---

> Tài liệu này phục vụ cho mục đích học tập và đồ án môn Phân Tích Thiết Kế Hệ Thống Thông Tin.
