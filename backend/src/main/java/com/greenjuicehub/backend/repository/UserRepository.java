package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);

    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmailAndIdNot(String email, Long id);
    boolean existsByUsernameAndIdNot(String username, Long id);

    // ── Admin filter ─────────────────────────────────────────────────────────

    /**
     * FIX: Tách role filter ra khỏi SpEL valueOf() để tránh NPE khi role = null.
     * Dùng u.role = com.greenjuicehub.backend.entity.User.Role.<value>
     * nhưng vì không thể dùng động trong JPQL, ta so sánh string của enum trực tiếp.
     *
     * Cách an toàn nhất: cast sang string rồi so sánh LIKE,
     * hoặc dùng 2 query riêng. Ở đây dùng CAST + FUNCTION để tránh SpEL.
     *
     * → Giải pháp đơn giản nhất: truyền role đã convert thành enum từ service,
     *   và dùng native approach: so sánh cột role (string) thẳng với :role string.
     */
    @Query("""
            SELECT u FROM User u
            WHERE (:keyword IS NULL OR :keyword = ''
                   OR LOWER(u.name)     LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR u.phone           LIKE CONCAT('%', :keyword, '%')
                   OR LOWER(u.email)    LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(u.username) LIKE LOWER(CONCAT('%', :keyword, '%')))
              AND (:role IS NULL OR :role = '' OR CAST(u.role AS string) = :role)
              AND (:isActive IS NULL OR u.isActive = :isActive)
            ORDER BY u.createdAt DESC
            """)
    Page<User> findByFilters(
            @Param("keyword") String keyword,
            @Param("role") String role,
            @Param("isActive") Boolean isActive,
            Pageable pageable
    );
}