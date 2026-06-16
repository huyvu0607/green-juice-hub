package com.greenjuicehub.backend.repository;

import com.greenjuicehub.backend.entity.TagDefinition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TagDefinitionRepository extends JpaRepository<TagDefinition, Long> {
    List<TagDefinition> findAllByOrderBySortOrderAsc();
    boolean existsByName(String name);
    List<TagDefinition> findAllByIsActiveTrueOrderBySortOrderAsc();

}