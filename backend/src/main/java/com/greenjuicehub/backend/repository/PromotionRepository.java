package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Promotion;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PromotionRepository extends JpaRepository<Promotion, Long> {

    Optional<Promotion> findByCodeIgnoreCase(String code);

    boolean existsByCodeIgnoreCase(String code);

    @Query("""
        SELECT p FROM Promotion p
        WHERE p.isActive = true
          AND p.target = 'PUBLIC'
          AND p.startsAt <= :now
          AND p.endsAt   >= :now
          AND (p.maxUses IS NULL OR p.usedCount < p.maxUses)
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
          AND (p.maxUses IS NULL OR p.usedCount < p.maxUses)
        ORDER BY p.endsAt ASC
    """)
    List<Promotion> findAllAvailablePersonal(@Param("userId") Long userId,
                                             @Param("now") LocalDateTime now);

    @Query("""
        SELECT p FROM Promotion p
        WHERE (:keyword IS NULL OR LOWER(p.code) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                  OR LOWER(p.name) LIKE LOWER(CONCAT('%', :keyword, '%')))
          AND (:target IS NULL OR p.target = :target)
          AND (:isActive IS NULL OR p.isActive = :isActive)
        ORDER BY p.id DESC
    """)
    Page<Promotion> findAllForAdmin(@Param("keyword") String keyword,
                                    @Param("target") Promotion.Target target,
                                    @Param("isActive") Boolean isActive,
                                    Pageable pageable);
}