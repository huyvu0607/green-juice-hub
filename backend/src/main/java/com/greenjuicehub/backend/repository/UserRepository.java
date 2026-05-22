package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhone(String phone);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsername(String username);
    boolean existsByPhone(String phone);
}