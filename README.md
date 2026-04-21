# ITAM — Hệ thống quản lý tài sản IT nội bộ

## Giai đoạn 1: Core — Laptop/PC & Người dùng

### Tech Stack
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React + Vite + TypeScript
- **Auth**: JWT (Bearer token)

---

## Cấu trúc dự án

```
itam/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/
│   │   │   ├── auth.py          # Đăng nhập, đăng ký, /me
│   │   │   ├── assets.py        # CRUD tài sản
│   │   │   ├── employees.py     # CRUD nhân viên
│   │   │   ├── assignments.py   # Bàn giao / thu hồi
│   │   │   ├── catalog.py       # Loại TS, vị trí, phòng ban
│   │   │   └── dashboard.py     # Thống kê tổng quan
│   │   ├── core/
│   │   │   ├── config.py        # Cấu hình env
│   │   │   ├── security.py      # JWT, bcrypt
│   │   │   └── deps.py          # Auth dependencies
│   │   ├── db/session.py        # SQLAlchemy engine
│   │   ├── models/models.py     # Tất cả ORM models
│   │   └── schemas/schemas.py   # Pydantic schemas
│   ├── requirements.txt
│   └── .env.example
│
└── frontend/
    └── src/
        ├── components/
        │   ├── layout/Layout.tsx  # Sidebar + main layout
        │   └── ui/index.tsx       # Button, Card, Table, Modal, Badge...
        ├── hooks/
        │   └── useCatalog.ts      # Custom hooks cho data fetching
        ├── lib/api.ts             # Axios client + interceptors
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── AssetsPage.tsx
        │   ├── AssetDetailPage.tsx
        │   ├── EmployeesPage.tsx
        │   ├── EmployeeDetailPage.tsx
        │   ├── AssignmentsPage.tsx
        │   └── CatalogPage.tsx
        ├── store/auth.ts          # Zustand auth store
        └── types/index.ts         # TypeScript interfaces
```

---

## Cài đặt & Chạy

### 1. PostgreSQL — Tạo database

```sql
CREATE DATABASE itam;
```

### 2. Backend

```bash
cd backend

# Tạo virtual environment
python -m venv venv
# source venv/bin/activate        # Linux/Mac
venv\Scripts\activate         # Windows

# Cài dependencies
pip install -r requirements.txt

# Tạo file .env
cp .env.example .env
# Sửa DATABASE_URL, SECRET_KEY trong .env

# Chạy server (tự động tạo bảng)
uvicorn app.main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### 3. Tạo tài khoản admin đầu tiên

```bash
# Dùng API docs hoặc curl:
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","email":"admin@company.com","password":"admin123","is_admin":true}'
```

### 4. Frontend

```bash
cd frontend

npm install
npm run dev
```

Truy cập: http://localhost:5173

---

## Tính năng Giai đoạn 1

| Tính năng | Mô tả |
|-----------|-------|
| Đăng nhập JWT | Phân quyền admin / viewer |
| Dashboard | Thống kê tổng quan + cảnh báo bảo hành |
| Quản lý tài sản | CRUD, lọc theo loại/trạng thái, soft delete |
| Quản lý nhân viên | CRUD, lọc theo phòng ban |
| Bàn giao / Thu hồi | Giao máy cho NV, thu hồi, sinh mã `HO-XXXXXXXX` |
| Lịch sử | Lịch sử bàn giao theo tài sản và theo nhân viên |
| Danh mục | Loại tài sản, vị trí (phòng/tầng), phòng ban |
| Audit log | Ghi lại mọi thao tác create/update/delete |
| Cảnh báo bảo hành | Hiển thị tài sản hết bảo hành trong 30 ngày |

---

## Giai đoạn tiếp theo (Phase 2)

- [ ] Import tài sản từ Excel hàng loạt
- [ ] Đính kèm tài liệu (hóa đơn, phiếu bảo hành)
- [ ] Quản lý linh kiện/nâng cấp (RAM, SSD)
- [ ] Gửi email cảnh báo tự động
- [ ] Báo cáo xuất Excel/PDF
