package com.greenjuicehub.backend.controller;

import com.greenjuicehub.backend.entity.TagDefinition;
import com.greenjuicehub.backend.exception.AppException;
import com.greenjuicehub.backend.repository.TagDefinitionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tags")
@RequiredArgsConstructor
public class AdminTagController {

    private final TagDefinitionRepository tagRepo;

    @GetMapping
    public ResponseEntity<List<TagDefinition>> getAll() {
        return ResponseEntity.ok(tagRepo.findAllByOrderBySortOrderAsc());
    }

    @PostMapping
    public ResponseEntity<TagDefinition> create(@RequestBody Map<String, String> body) {
        String name = body.get("name").trim().toLowerCase();
        if (tagRepo.existsByName(name))
            throw new AppException(HttpStatus.CONFLICT, "Tag đã tồn tại");
        return ResponseEntity.ok(
                tagRepo.save(TagDefinition.builder().name(name).isActive(true).sortOrder(0).build())
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        tagRepo.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<TagDefinition> toggle(@PathVariable Long id) {
        TagDefinition tag = tagRepo.findById(id)
                .orElseThrow(() -> new AppException(HttpStatus.NOT_FOUND, "Tag không tồn tại"));
        tag.setIsActive(!tag.getIsActive());
        return ResponseEntity.ok(tagRepo.save(tag));
    }
}