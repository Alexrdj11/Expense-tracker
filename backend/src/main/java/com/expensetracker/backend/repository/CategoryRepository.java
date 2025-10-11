package com.expensetracker.backend.repository;

import com.expensetracker.backend.model.Category;
import org.springframework.data.repository.ListCrudRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends ListCrudRepository<Category, Long> {
    List<Category> findByUserId(Long userId);
    boolean existsByUserIdAndName(Long userId, String name);
    Optional<Category> findByUserIdAndName(Long userId, String name); // add this
}
