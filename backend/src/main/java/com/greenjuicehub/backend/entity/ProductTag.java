package com.greenjuicehub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "product_tags")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ProductTag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(length = 50, nullable = false)
    private String tag;
}