package com.greenjuicehub.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tag_definitions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TagDefinition {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String name;

    private Boolean isActive = true;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}