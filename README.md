# 🥤 Green Juice Hub

> E-commerce website for fresh juices, smoothies, granola, and Greek yogurt.

![Status](https://img.shields.io/badge/status-in%20development-yellow)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📋 Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Database](#database)
- [Team](#team)

---

## 🌿 About

**Green Juice Hub** là nền tảng thương mại điện tử chuyên cung cấp các sản phẩm healthy:
- 🍎 Nước ép tươi
- 🥤 Smoothie
- 🌾 Granola
- 🫙 Sữa chua Hy Lạp

---

## ✨ Features

- 🔍 Tìm kiếm, lọc, sắp xếp sản phẩm
- 🔐 Đăng nhập bằng Số điện thoại (OTP) & Google OAuth
- 🛒 Giỏ hàng & Thanh toán (COD, VNPay, Momo)
- 🏷️ Khuyến mãi, giá gốc / giá sale
- ⭐ Đánh giá & Bình luận sản phẩm
- 📦 Quản lý đơn hàng
- 📱 Responsive (Mobile, Tablet, Desktop)
- 🗺️ Google Maps tích hợp
- 📋 Chính sách vận chuyển, đổi trả, bảo hành
- 🛠️ Trang quản trị (Admin Dashboard)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Tailwind CSS |
| Backend | Spring Boot |
| Database | MySQL |
| Auth | JWT, OTP (SMS), Google OAuth 2.0 |
| Payment | VNPay, Momo, COD |

---

## 🚀 Getting Started

### Yêu cầu

- Node.js >= 18
- Java >= 17
- MySQL >= 8.0
- Maven >= 3.8

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
./mvnw spring-boot:run
```

### Database

```bash
mysql -u root -p < database/schema.sql
```

---

## 📁 Project Structure

```
green-juice-hub/
├── frontend/               # React + Tailwind CSS
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Các trang
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API calls
│   │   ├── store/          # State management
│   │   └── utils/          # Helper functions
│   └── public/
│
├── backend/                # Spring Boot
│   └── src/main/java/
│       └── com/greenjuicehub/
│           ├── controller/
│           ├── service/
│           ├── repository/
│           ├── entity/
│           ├── dto/
│           └── config/
│
└── database/
    └── schema.sql          # MySQL schema (22 bảng)
```

---

## 🗄️ Database

Tổng cộng **22 bảng** chia theo nhóm:

| Nhóm | Bảng |
|---|---|
| Auth | users, otp_verifications, social_accounts |
| Địa chỉ | addresses |
| Sản phẩm | categories, flavors, sizes, products, product_images, product_tags, product_variants |
| Giỏ hàng | carts, cart_items |
| Đơn hàng | orders, order_items, payments |
| Khuyến mãi | promotions, promotion_usages |
| Đánh giá | reviews |
| Liên hệ | contacts |
| Chính sách | shipping_policies |
| Marketing | banners |

---

## 👥 Team

| Thành viên | Role |
|---|---|
| ... | Frontend Developer |
| ... | Backend Developer |
| ... | Database Designer |

---

> Made with 💚 by Green Juice Hub Team