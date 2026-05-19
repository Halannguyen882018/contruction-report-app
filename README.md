# Construction Daily Report App
# Nhật Ký Thi Công Hàng Ngày

Web app cho nhà thầu báo cáo tiến độ thi công hàng ngày, chủ nhà theo dõi và kiểm soát.

## Features

- **Login/Register** - Nhà thầu & Chủ nhà đăng ký với vai trò riêng
- **Project Management** - Tạo và quản lý dự án xây dựng
- **Work Categories** - Tạo hạng mục công việc (Móng, Tường, Mái, Điện, Nước...)
- **Daily Reports** - Báo cáo hàng ngày: số thợ, công việc, tiến độ, ghi chú
- **Photo Upload** - Chụp hình / đính kèm file vào báo cáo
- **Owner Dashboard** - Chủ nhà xem báo cáo, hình ảnh, theo dõi tiến độ
- **Filter & Search** - Lọc theo dự án, ngày, hạng mục

## Tech Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth + PostgreSQL + Storage)
- **Tailwind CSS**
- **TypeScript**

## Setup

### 1. Create Supabase Project

Go to [supabase.com](https://supabase.com), create a new project.

### 2. Run Database Schema

Copy contents of `supabase/schema.sql` and run it in **Supabase SQL Editor**.

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase URL and anon key (found in Project Settings > API).

### 4. Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Usage Flow

1. **Chủ nhà** đăng ký (role: Owner) → Tạo dự án → Tạo hạng mục → Mời nhà thầu
2. **Nhà thầu** đăng ký (role: Contractor) → Được mời vào dự án → Báo cáo hàng ngày
3. **Chủ nhà** vào Dashboard xem báo cáo, hình ảnh, theo dõi tiến độ
