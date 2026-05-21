package com.greenjuicehub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "flavors")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Flavor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 100, nullable = false)
    private String name;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;
}