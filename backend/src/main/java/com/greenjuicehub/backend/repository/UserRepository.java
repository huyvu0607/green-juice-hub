package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    boolean existsByPhone(String phone);

    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    /** Kiểm tra email đã tồn tại ở user khác chưa (dùng khi update profile) */
    boolean existsByEmailAndIdNot(String email, Long id);

    /** Kiểm tra username đã tồn tại ở user khác chưa (dùng khi update profile) */
    boolean existsByUsernameAndIdNot(String username, Long id);
}