package com.greenjuicehub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sizes")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Size {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50, nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}