package com.expensetracker.backend.controller;

import com.expensetracker.backend.model.Category;
import com.expensetracker.backend.repository.CategoryRepository;
import com.expensetracker.backend.repository.AppUserRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository repo;
    private final AppUserRepository users;

    public CategoryController(CategoryRepository repo, AppUserRepository users) {
        this.repo = repo;
        this.users = users;
    }

    private Long userId(Principal principal) {
        return users.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"))
                .getId();
    }

    @GetMapping
    public List<Category> list(Principal principal) {
        return repo.findByUserId(userId(principal));
    }

    @PostMapping
    public ResponseEntity<Category> create(@Valid @RequestBody Category category, Principal principal) {
        Long uid = userId(principal);
        if (repo.existsByUserIdAndName(uid, category.getName())) {
            throw new IllegalArgumentException("Category already exists");
        }
        category.setUserId(uid);
        Category saved = repo.save(category);
        return ResponseEntity
                .created(URI.create("/api/categories/" + saved.getId()))
                .body(saved);
    }
}
