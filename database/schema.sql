-- ============================================================
-- GREEN JUICE HUB — MySQL Schema
-- Version: 1.0 | Date: 2026-05-20
-- ============================================================

CREATE DATABASE IF NOT EXISTS green_juice_hub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE green_juice_hub;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  name             VARCHAR(100),
  phone            VARCHAR(15)  UNIQUE NOT NULL COMMENT 'Định danh chính',
  phone_verified_at TIMESTAMP   NULL,
  email            VARCHAR(100) UNIQUE NULL,
  password_hash    VARCHAR(255) NULL,
  has_password     BOOLEAN      NOT NULL DEFAULT FALSE,
  avatar_url       VARCHAR(500) NULL,
  role             ENUM('customer','staff','admin') NOT NULL DEFAULT 'customer',
  is_active        BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 2. OTP VERIFICATIONS
-- ============================================================
CREATE TABLE otp_verifications (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  phone      VARCHAR(15)  NOT NULL,
  otp_code   VARCHAR(6)   NOT NULL,
  type       ENUM('register','login','reset_password') NOT NULL,
  is_used    BOOLEAN      NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMP    NOT NULL,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_phone (phone),
  INDEX idx_otp_expires (expires_at)
) ENGINE=InnoDB;

-- ============================================================
-- 3. SOCIAL ACCOUNTS
-- ============================================================
CREATE TABLE social_accounts (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT       NOT NULL,
  provider    ENUM('google') NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email       VARCHAR(100) NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_provider (provider, provider_id),
  CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 4. ADDRESSES
-- ============================================================
CREATE TABLE addresses (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT       NOT NULL,
  full_name  VARCHAR(100) NOT NULL,
  phone      VARCHAR(15)  NOT NULL,
  province   VARCHAR(100) NOT NULL,
  district   VARCHAR(100) NOT NULL,
  ward       VARCHAR(100) NOT NULL,
  detail     TEXT         NOT NULL,
  is_default BOOLEAN      NOT NULL DEFAULT FALSE,
  CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 5. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT         NULL,
  image_url   VARCHAR(500) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 6. FLAVORS
-- ============================================================
CREATE TABLE flavors (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(100) NOT NULL,
  is_active BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 7. SIZES
-- ============================================================
CREATE TABLE sizes (
  id        BIGINT AUTO_INCREMENT PRIMARY KEY,
  name      VARCHAR(50)  NOT NULL,
  is_active BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- 8. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  category_id  BIGINT       NOT NULL,
  name         VARCHAR(200) NOT NULL,
  slug         VARCHAR(200) NOT NULL UNIQUE,
  description  TEXT         NULL,
  avg_rating   FLOAT        NOT NULL DEFAULT 0,
  review_count INT          NOT NULL DEFAULT 0,
  is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB;

-- ============================================================
-- 9. PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT       NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  is_primary BOOLEAN      NOT NULL DEFAULT FALSE,
  sort_order INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_img_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 10. PRODUCT TAGS
-- ============================================================
CREATE TABLE product_tags (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id BIGINT      NOT NULL,
  tag        VARCHAR(50) NOT NULL,
  CONSTRAINT fk_tag_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 11. PRODUCT VARIANTS
-- ============================================================
CREATE TABLE product_variants (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id       BIGINT         NOT NULL,
  flavor_id        BIGINT         NULL,
  size_id          BIGINT         NULL,
  original_price   DECIMAL(12,2)  NOT NULL,
  sale_price       DECIMAL(12,2)  NOT NULL,
  discount_percent DECIMAL(5,2)   NOT NULL DEFAULT 0,
  stock_qty        INT            NOT NULL DEFAULT 0,
  is_active        BOOLEAN        NOT NULL DEFAULT TRUE,
  sort_order       INT            NOT NULL DEFAULT 0,
  CONSTRAINT fk_var_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  CONSTRAINT fk_var_flavor  FOREIGN KEY (flavor_id)  REFERENCES flavors(id),
  CONSTRAINT fk_var_size    FOREIGN KEY (size_id)    REFERENCES sizes(id)
) ENGINE=InnoDB;

-- ============================================================
-- 12. CARTS
-- ============================================================
CREATE TABLE carts (
  id         BIGINT    AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT    NOT NULL UNIQUE COMMENT '1 user = 1 cart',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- 13. CART ITEMS
-- ============================================================
CREATE TABLE cart_items (
  id         BIGINT    AUTO_INCREMENT PRIMARY KEY,
  cart_id    BIGINT    NOT NULL,
  product_id BIGINT    NOT NULL,
  variant_id BIGINT    NOT NULL,
  quantity   INT       NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_cart_variant (cart_id, variant_id),
  CONSTRAINT fk_ci_cart    FOREIGN KEY (cart_id)    REFERENCES carts(id) ON DELETE CASCADE,
  CONSTRAINT fk_ci_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_ci_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

-- ============================================================
-- 14. PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
  id                BIGINT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(50)   NOT NULL UNIQUE,
  name              VARCHAR(200)  NOT NULL,
  type              ENUM('percent','fixed') NOT NULL,
  value             DECIMAL(12,2) NOT NULL,
  min_order_value   DECIMAL(12,2) NOT NULL DEFAULT 0,
  target            ENUM('public','personal') NOT NULL DEFAULT 'public',
  user_id           BIGINT        NULL COMMENT 'Chỉ điền nếu target = personal',
  max_uses          INT           NOT NULL DEFAULT 1,
  max_uses_per_user INT           NULL,
  used_count        INT           NOT NULL DEFAULT 0,
  starts_at         DATETIME      NOT NULL,
  ends_at           DATETIME      NOT NULL,
  is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
  CONSTRAINT fk_promo_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- 15. PROMOTION USAGES
-- ============================================================
CREATE TABLE promotion_usages (
  id           BIGINT    AUTO_INCREMENT PRIMARY KEY,
  promotion_id BIGINT    NOT NULL,
  user_id      BIGINT    NOT NULL,
  order_id     BIGINT    NOT NULL,
  used_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pu_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id),
  CONSTRAINT fk_pu_user      FOREIGN KEY (user_id)      REFERENCES users(id),
  INDEX idx_pu_promotion_user (promotion_id, user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 16. ORDERS
-- ============================================================
CREATE TABLE orders (
  id               BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT        NOT NULL,
  promotion_id     BIGINT        NULL,
  order_code       VARCHAR(50)   NOT NULL UNIQUE,
  subtotal         DECIMAL(12,2) NOT NULL,
  discount_amount  DECIMAL(12,2) NOT NULL DEFAULT 0,
  shipping_fee     DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount     DECIMAL(12,2) NOT NULL,
  status           ENUM('pending','confirmed','shipping','delivered','cancelled') NOT NULL DEFAULT 'pending',
  payment_status   ENUM('pending','paid','refunded') NOT NULL DEFAULT 'pending',
  shipping_address JSON          NOT NULL COMMENT 'Snapshot địa chỉ giao hàng',
  note             TEXT          NULL,
  created_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_user      FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT fk_order_promotion FOREIGN KEY (promotion_id) REFERENCES promotions(id) ON DELETE SET NULL,
  INDEX idx_order_status (status),
  INDEX idx_order_user (user_id)
) ENGINE=InnoDB;

-- ============================================================
-- 17. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
  id           BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id     BIGINT        NOT NULL,
  product_id   BIGINT        NOT NULL,
  variant_id   BIGINT        NOT NULL,
  product_name VARCHAR(200)  NOT NULL COMMENT 'Snapshot tên sản phẩm',
  variant_name VARCHAR(100)  NOT NULL COMMENT 'Snapshot tên variant',
  unit_price   DECIMAL(12,2) NOT NULL COMMENT 'Giá tại thời điểm mua',
  quantity     INT           NOT NULL,
  subtotal     DECIMAL(12,2) NOT NULL,
  CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_oi_variant FOREIGN KEY (variant_id) REFERENCES product_variants(id)
) ENGINE=InnoDB;

-- ============================================================
-- 18. PAYMENTS
-- ============================================================
CREATE TABLE payments (
  id             BIGINT AUTO_INCREMENT PRIMARY KEY,
  order_id       BIGINT        NOT NULL,
  method         ENUM('cod','vnpay','momo','bank_transfer') NOT NULL,
  status         ENUM('pending','success','failed','refunded') NOT NULL DEFAULT 'pending',
  amount         DECIMAL(12,2) NOT NULL,
  transaction_id VARCHAR(255)  NULL COMMENT 'Mã giao dịch từ cổng thanh toán',
  paid_at        TIMESTAMP     NULL,
  note           TEXT          NULL,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  INDEX idx_pay_order (order_id)
) ENGINE=InnoDB;

-- ============================================================
-- 19. REVIEWS
-- ============================================================
CREATE TABLE reviews (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  product_id  BIGINT    NOT NULL,
  user_id     BIGINT    NOT NULL,
  order_id    BIGINT    NOT NULL,
  rating      TINYINT   NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT      NULL,
  image_url   VARCHAR(500) NULL,
  is_approved BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_review (product_id, user_id, order_id) COMMENT '1 đánh giá / sản phẩm / đơn hàng',
  CONSTRAINT fk_rev_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_rev_user    FOREIGN KEY (user_id)    REFERENCES users(id),
  CONSTRAINT fk_rev_order   FOREIGN KEY (order_id)   REFERENCES orders(id)
) ENGINE=InnoDB;

-- ============================================================
-- 20. CONTACTS
-- ============================================================
CREATE TABLE contacts (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  full_name  VARCHAR(100) NOT NULL,
  email      VARCHAR(100) NOT NULL,
  phone      VARCHAR(15)  NULL,
  subject    VARCHAR(200) NOT NULL,
  message    TEXT         NOT NULL,
  status     ENUM('new','in_progress','resolved') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 21. SHIPPING POLICIES
-- ============================================================
CREATE TABLE shipping_policies (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  type       ENUM('shipping','return','warranty','terms') NOT NULL,
  title      VARCHAR(200) NOT NULL,
  content    LONGTEXT     NOT NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- 22. BANNERS
-- ============================================================
CREATE TABLE banners (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  title      VARCHAR(200) NOT NULL,
  image_url  VARCHAR(500) NOT NULL,
  link_url   VARCHAR(500) NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  is_active  BOOLEAN      NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ============================================================
-- SEED DATA MẪU
-- ============================================================

-- Categories
INSERT INTO categories (name, slug, sort_order) VALUES
('Nước ép',          'nuoc-ep',          1),
('Smoothie',         'smoothie',         2),
('Granola',          'granola',          3),
('Sữa chua Hy Lạp',  'sua-chua-hy-lap',  4);

-- Flavors
INSERT INTO flavors (name) VALUES
('Táo'), ('Cà rốt'), ('Cam'), ('Dâu'), ('Việt quất'),
('Dưa hấu'), ('Xoài'), ('Cần tây');

-- Sizes
INSERT INTO sizes (name) VALUES
('250ml'), ('500ml'), ('1L'), ('300g'), ('500g');

-- Admin account mẫu
INSERT INTO users (name, phone, phone_verified_at, has_password, password_hash, role) VALUES
('Admin', '0900000000', NOW(), TRUE, '$2a$10$examplehashedpassword', 'admin');

-- Shipping policies mẫu
INSERT INTO shipping_policies (type, title, content, sort_order) VALUES
('shipping', 'Chính sách vận chuyển', 'Giao hàng toàn quốc trong 2-5 ngày làm việc. Miễn phí vận chuyển cho đơn hàng từ 300.000đ.', 1),
('return',   'Chính sách đổi trả',    'Hỗ trợ đổi trả trong vòng 24 giờ kể từ khi nhận hàng nếu sản phẩm lỗi hoặc không đúng mô tả.', 2),
('warranty', 'Chính sách bảo hành',   'Sản phẩm được kiểm định chất lượng trước khi giao. Cam kết hoàn tiền 100% nếu sản phẩm không đảm bảo.', 3),
('terms',    'Điều khoản sử dụng',    'Bằng cách sử dụng dịch vụ, bạn đồng ý với các điều khoản và điều kiện của Green Juice Hub.', 4);

SELECT COUNT(*) AS total_tables
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'green_juice_hub';