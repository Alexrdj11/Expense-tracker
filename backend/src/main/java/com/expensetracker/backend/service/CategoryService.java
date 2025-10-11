package com.expensetracker.backend.service;

import com.expensetracker.backend.model.Category;
import com.expensetracker.backend.repository.CategoryRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CategoryService {

    private final CategoryRepository repo;

    public CategoryService(CategoryRepository repo) {
        this.repo = repo;
    }

    public List<Category> listAll() {
        return repo.findAll();
    }

    public Category create(Category c) {
        return repo.save(c);
    }

    public Optional<Category> find(Long id) {
        return repo.findById(id);
    }

    public boolean delete(Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }
}

