package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Promotion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    Optional<Promotion> findByCodeIgnoreCase(String code);

    @Query("""
        SELECT p FROM Promotion p
        WHERE p.isActive = true
          AND p.target = 'PUBLIC'
          AND p.startsAt <= :now
          AND p.endsAt   >= :now
          AND p.usedCount < p.maxUses
        ORDER BY p.endsAt ASC
    """)
    List<Promotion> findAllAvailablePublic(@Param("now") LocalDateTime now);

    @Query("""
        SELECT p FROM Promotion p
        WHERE p.isActive = true
          AND p.target = 'PERSONAL'
          AND p.user.id = :userId
          AND p.startsAt <= :now
          AND p.endsAt   >= :now
          AND p.usedCount < p.maxUses
        ORDER BY p.endsAt ASC
    """)
    List<Promotion> findAllAvailablePersonal(@Param("userId") Long userId,
                                             @Param("now") LocalDateTime now);
}