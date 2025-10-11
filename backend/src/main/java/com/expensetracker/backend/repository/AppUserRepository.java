package com.expensetracker.backend.repository;

import com.expensetracker.backend.model.AppUser;
import org.springframework.data.repository.ListCrudRepository;

import java.util.Optional;

public interface AppUserRepository extends ListCrudRepository<AppUser, Long> {
    Optional<AppUser> findByUsername(String username);
}