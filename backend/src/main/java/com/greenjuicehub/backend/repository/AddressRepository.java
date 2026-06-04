package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.Address;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AddressRepository extends JpaRepository<Address, Long> {

    /** Lấy tất cả địa chỉ của user, sắp xếp default lên đầu */
    @Query("SELECT a FROM Address a WHERE a.user.id = :userId ORDER BY a.isDefault DESC, a.id ASC")
    List<Address> findAllByUserIdOrdered(@Param("userId") Long userId);

    /** Tìm địa chỉ theo id và userId (tránh truy cập chéo user) */
    Optional<Address> findByIdAndUserId(Long id, Long userId);

    /** Đếm số địa chỉ của user */
    int countByUserId(Long userId);

    /** Bỏ default tất cả địa chỉ của user (dùng trước khi set default mới) */
    @Modifying
    @Query("UPDATE Address a SET a.isDefault = false WHERE a.user.id = :userId")
    void clearDefaultByUserId(@Param("userId") Long userId);

    /** Kiểm tra user có địa chỉ default chưa */
    boolean existsByUserIdAndIsDefaultTrue(Long userId);
}