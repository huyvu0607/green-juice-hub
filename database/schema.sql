-- ============================================================
-- GREEN JUICE HUB — MySQL Schema
-- Version: 2.0 | Synced with Java entities
-- ============================================================

CREATE DATABASE IF NOT EXISTS green_juice_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE green_juice_hub;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE users (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    name            VARCHAR(100)    NULL,
    phone           VARCHAR(15)     UNIQUE NULL,
    phone_verified_at TIMESTAMP     NULL,
    email           VARCHAR(100)    UNIQUE NULL,
    username        VARCHAR(50)     UNIQUE NULL,
    password_hash   VARCHAR(255)    NULL,
    has_password    BOOLEAN         NOT NULL DEFAULT FALSE,
    avatar_url      VARCHAR(500)    NULL,
    role            ENUM('CUSTOMER','STAFF','ADMIN') NOT NULL DEFAULT 'CUSTOMER',
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ============================================================
-- 2. OTP VERIFICATIONS
-- ============================================================
CREATE TABLE otp_verifications (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    phone       VARCHAR(15)     NOT NULL,
    otp_code    VARCHAR(6)      NOT NULL,
    type        ENUM('REGISTER','LOGIN','RESET_PASSWORD') NOT NULL,
    is_used     BOOLEAN         NOT NULL DEFAULT FALSE,
    expires_at  TIMESTAMP       NOT NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_otp_phone   (phone),
    INDEX idx_otp_expires (expires_at)
) ENGINE = InnoDB;

-- ============================================================
-- 3. SOCIAL ACCOUNTS
-- ============================================================
CREATE TABLE social_accounts (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL,
    provider    ENUM('GOOGLE')  NOT NULL,
    provider_id VARCHAR(255)    NOT NULL,
    email       VARCHAR(100)    NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_provider (provider, provider_id),
    CONSTRAINT fk_social_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- 4. ADDRESSES
-- ============================================================
CREATE TABLE addresses (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL,
    full_name   VARCHAR(100)    NOT NULL,
    phone       VARCHAR(15)     NOT NULL,
    province    VARCHAR(100)    NOT NULL,
    district    VARCHAR(100)    NOT NULL,
    ward        VARCHAR(100)    NOT NULL,
    detail      TEXT            NOT NULL,
    is_default  BOOLEAN         NOT NULL DEFAULT FALSE,
    district_id INT             NULL     COMMENT 'GHN district_id',
    ward_code   VARCHAR(10)     NULL     COMMENT 'GHN ward_code',
    CONSTRAINT fk_addr_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- 5. CATEGORIES
-- ============================================================
CREATE TABLE categories (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    slug        VARCHAR(100)    NOT NULL UNIQUE,
    description TEXT            NULL,
    image_url   VARCHAR(500)    NULL,
    sort_order  INT             NOT NULL DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

-- ============================================================
-- 6. FLAVORS
-- ============================================================
CREATE TABLE flavors (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100)    NOT NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

-- ============================================================
-- 7. SIZES
-- ============================================================
CREATE TABLE sizes (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;

-- ============================================================
-- 8. PRODUCTS
-- ============================================================
CREATE TABLE products (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id  BIGINT          NOT NULL,
    name         VARCHAR(200)    NOT NULL,
    slug         VARCHAR(200)    NOT NULL UNIQUE,
    description  TEXT            NULL,
    avg_rating   FLOAT           NOT NULL DEFAULT 0,
    review_count INT             NOT NULL DEFAULT 0,
    is_active    BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id) REFERENCES categories (id)
) ENGINE = InnoDB;

-- ============================================================
-- 9. PRODUCT IMAGES
-- ============================================================
CREATE TABLE product_images (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT          NOT NULL,
    image_url   VARCHAR(500)    NOT NULL,
    is_primary  BOOLEAN         NOT NULL DEFAULT FALSE,
    sort_order  INT             NOT NULL DEFAULT 0,
    CONSTRAINT fk_img_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- 10. PRODUCT TAGS
-- ============================================================
CREATE TABLE product_tags (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id  BIGINT          NOT NULL,
    tag         VARCHAR(50)     NOT NULL,
    CONSTRAINT fk_tag_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- 11. TAG DEFINITIONS
-- ============================================================
CREATE TABLE tag_definitions (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(50)     NOT NULL UNIQUE,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    sort_order  INT             NOT NULL DEFAULT 0
) ENGINE = InnoDB;

INSERT INTO tag_definitions (name, is_active, sort_order) VALUES
    ('bestseller', TRUE, 1),
    ('organic',    TRUE, 2),
    ('new',        TRUE, 3),
    ('sugar-free', TRUE, 4);

-- ============================================================
-- 12. PRODUCT VARIANTS
-- ============================================================
CREATE TABLE product_variants (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id       BIGINT           NOT NULL,
    flavor_id        BIGINT           NULL,
    size_id          BIGINT           NULL,
    original_price   DECIMAL(12,2)    NOT NULL,
    sale_price       DECIMAL(12,2)    NOT NULL,
    discount_percent DECIMAL(5,2)     NOT NULL DEFAULT 0,
    stock_qty        INT              NOT NULL DEFAULT 0,
    is_active        BOOLEAN          NOT NULL DEFAULT TRUE,
    sort_order       INT              NOT NULL DEFAULT 0,
    weight_gram      INT              NOT NULL DEFAULT 500 COMMENT 'Trọng lượng gram',
    CONSTRAINT fk_var_product FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE,
    CONSTRAINT fk_var_flavor  FOREIGN KEY (flavor_id)  REFERENCES flavors (id),
    CONSTRAINT fk_var_size    FOREIGN KEY (size_id)    REFERENCES sizes (id)
) ENGINE = InnoDB;

-- ============================================================
-- 13. CARTS
-- ============================================================
CREATE TABLE carts (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT          NOT NULL UNIQUE,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE = InnoDB;

-- ============================================================
-- 14. CART ITEMS
-- ============================================================
CREATE TABLE cart_items (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    cart_id     BIGINT          NOT NULL,
    product_id  BIGINT          NOT NULL,
    variant_id  BIGINT          NOT NULL,
    quantity    INT             NOT NULL DEFAULT 1,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_cart_variant (cart_id, variant_id),
    INDEX idx_ci_product (product_id),
    CONSTRAINT fk_ci_cart    FOREIGN KEY (cart_id)    REFERENCES carts (id) ON DELETE CASCADE,
    CONSTRAINT fk_ci_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_ci_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id)
) ENGINE = InnoDB;

-- ============================================================
-- 15. PROMOTIONS
-- ============================================================
CREATE TABLE promotions (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    code              VARCHAR(50)      NOT NULL UNIQUE,
    name              VARCHAR(200)     NOT NULL,
    type              ENUM('PERCENT','FIXED') NOT NULL,
    value             DECIMAL(12,2)    NOT NULL,
    min_order_value   DECIMAL(12,2)    NOT NULL DEFAULT 0,
    free_shipping     BOOLEAN          NOT NULL DEFAULT FALSE,
    target            ENUM('PUBLIC','PERSONAL') NOT NULL DEFAULT 'PUBLIC',
    user_id           BIGINT           NULL,
    max_uses          INT              NULL     COMMENT 'NULL = không giới hạn',
    max_uses_per_user INT              NULL,
    used_count        INT              NOT NULL DEFAULT 0,
    starts_at         DATETIME         NOT NULL,
    ends_at           DATETIME         NOT NULL,
    is_active         BOOLEAN          NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_promo_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE = InnoDB;

-- ============================================================
-- 16. ORDERS
-- ============================================================
CREATE TABLE orders (
    id               BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT           NOT NULL,
    promotion_id     BIGINT           NULL,
    order_code       VARCHAR(50)      NOT NULL UNIQUE,
    subtotal         DECIMAL(12,2)    NOT NULL,
    discount_amount  DECIMAL(12,2)    NOT NULL DEFAULT 0,
    shipping_fee     DECIMAL(12,2)    NOT NULL DEFAULT 0,
    total_amount     DECIMAL(12,2)    NOT NULL,
    status           ENUM('PENDING','CONFIRMED','SHIPPING','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
    payment_status   ENUM('PENDING','PAID','REFUND_PENDING','REFUNDED')             NOT NULL DEFAULT 'PENDING',
    shipping_address JSON             NOT NULL,
    note             TEXT             NULL,
    cancel_reason    VARCHAR(500)     NULL,
    created_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_order_user      FOREIGN KEY (user_id)      REFERENCES users (id),
    CONSTRAINT fk_order_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id) ON DELETE SET NULL,
    INDEX idx_order_status (status),
    INDEX idx_order_user   (user_id)
) ENGINE = InnoDB;

-- ============================================================
-- 17. ORDER ITEMS
-- ============================================================
CREATE TABLE order_items (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id     BIGINT          NOT NULL,
    product_id   BIGINT          NOT NULL,
    variant_id   BIGINT          NOT NULL,
    product_name VARCHAR(200)    NOT NULL,
    variant_name VARCHAR(100)    NOT NULL,
    unit_price   DECIMAL(12,2)   NOT NULL,
    quantity     INT             NOT NULL,
    subtotal     DECIMAL(12,2)   NOT NULL,
    INDEX idx_oi_order   (order_id),
    INDEX idx_oi_product (product_id),
    CONSTRAINT fk_oi_order   FOREIGN KEY (order_id)   REFERENCES orders (id) ON DELETE CASCADE,
    CONSTRAINT fk_oi_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_oi_variant FOREIGN KEY (variant_id) REFERENCES product_variants (id)
) ENGINE = InnoDB;

-- ============================================================
-- 18. PROMOTION USAGES  (sau orders để FK hợp lệ)
-- ============================================================
CREATE TABLE promotion_usages (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    promotion_id BIGINT          NOT NULL,
    user_id      BIGINT          NOT NULL,
    order_id     BIGINT          NOT NULL,
    used_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pu_promotion FOREIGN KEY (promotion_id) REFERENCES promotions (id),
    CONSTRAINT fk_pu_user      FOREIGN KEY (user_id)      REFERENCES users (id),
    CONSTRAINT fk_pu_order     FOREIGN KEY (order_id)     REFERENCES orders (id),
    INDEX idx_pu_promotion_user (promotion_id, user_id),
    INDEX idx_pu_order          (order_id)
) ENGINE = InnoDB;

-- ============================================================
-- 19. PAYMENTS
-- ============================================================
CREATE TABLE payments (
    id             BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id       BIGINT          NOT NULL,
    method         ENUM('COD','VNPAY','MOMO','BANK_TRANSFER') NOT NULL,
    status         ENUM('PENDING','SUCCESS','FAILED','REFUNDED') NOT NULL DEFAULT 'PENDING',
    amount         DECIMAL(12,2)   NOT NULL,
    transaction_id VARCHAR(255)    NULL,
    paid_at        TIMESTAMP       NULL,
    note           TEXT            NULL,
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_pay_order FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
    INDEX idx_pay_order (order_id)
) ENGINE = InnoDB;

-- ============================================================
-- 20. REVIEWS
-- -- Fixes: is_approved DEFAULT TRUE; thêm reply/replied_at/product_name;
-- -- rating dùng TINYINT (signed) để khớp Java Byte
-- ============================================================
CREATE TABLE reviews (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id   BIGINT          NOT NULL,
    user_id      BIGINT          NOT NULL,
    order_id     BIGINT          NOT NULL,
    rating       TINYINT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT            NULL,
    image_url    VARCHAR(500)    NULL,
    is_approved  BOOLEAN         NOT NULL DEFAULT TRUE,
    reply        TEXT            NULL     COMMENT 'Phản hồi từ Admin/Staff',
    replied_at   DATETIME        NULL,
    product_name VARCHAR(200)    NULL     COMMENT 'Snapshot tên sản phẩm lúc đánh giá',
    created_at   TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_review (product_id, user_id, order_id),
    INDEX idx_rev_product (product_id),
    CONSTRAINT fk_rev_product FOREIGN KEY (product_id) REFERENCES products (id),
    CONSTRAINT fk_rev_user    FOREIGN KEY (user_id)    REFERENCES users (id),
    CONSTRAINT fk_rev_order   FOREIGN KEY (order_id)   REFERENCES orders (id)
) ENGINE = InnoDB;

-- ============================================================
-- 21. CONTACTS
-- ============================================================
CREATE TABLE contacts (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name       VARCHAR(100)    NOT NULL,
    email           VARCHAR(100)    NOT NULL,
    phone           VARCHAR(15)     NULL,
    subject         VARCHAR(200)    NOT NULL,
    message         TEXT            NOT NULL,
    status          ENUM('NEW','IN_PROGRESS','RESOLVED') NOT NULL DEFAULT 'NEW',
    reply           TEXT            NULL,
    replied_at      DATETIME        NULL,
    replied_by_name VARCHAR(100)    NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ============================================================
-- 22. SHIPPING POLICIES
-- ============================================================
CREATE TABLE shipping_policies (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    type        ENUM('SHIPPING','RETURN','WARRANTY','TERMS') NOT NULL UNIQUE,
    title       VARCHAR(200)    NOT NULL,
    content     LONGTEXT        NOT NULL,
    sort_order  INT             NOT NULL DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

-- ============================================================
-- 23. BANNERS
-- ============================================================
CREATE TABLE banners (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200)    NOT NULL,
    description VARCHAR(500)    NULL,
    image_url   VARCHAR(500)    NOT NULL,
    link_url    VARCHAR(500)    NULL,
    sort_order  INT             NOT NULL DEFAULT 0,
    is_active   BOOLEAN         NOT NULL DEFAULT TRUE
) ENGINE = InnoDB;