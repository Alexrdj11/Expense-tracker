package com.expensetracker.backend.service;

import com.expensetracker.backend.model.Expense;
import com.expensetracker.backend.repository.ExpenseRepository;
import com.expensetracker.backend.repository.AppUserRepository;
import com.expensetracker.backend.model.AppUser;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository repo;
    private final AppUserRepository users;

    public ExpenseService(ExpenseRepository repo, AppUserRepository users) {
        this.repo = repo;
        this.users = users;
    }

    private Long userIdFromUsername(String username) {
        return users.findByUsername(username).map(AppUser::getId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public List<Expense> listForUser(String username) {
        return repo.findByUserId(userIdFromUsername(username));
    }

    public Expense createForUser(String username, Expense e) {
        e.setUserId(userIdFromUsername(username));
        return repo.save(e);
    }

    public Optional<Expense> findForUser(Long id, String username) {
        return repo.findByIdAndUserId(id, userIdFromUsername(username));
    }

    public Optional<Expense> updateForUser(Long id, String username, Expense incoming) {
        Long uid = userIdFromUsername(username);
        return repo.findByIdAndUserId(id, uid).map(e -> {
            e.setDescription(incoming.getDescription());
            e.setAmount(incoming.getAmount());
            // keep your existing category/categoryId field as-is
            e.setExpenseDate(incoming.getExpenseDate());
            e.setUserId(uid);
            return repo.save(e);
        });
    }

    public boolean deleteForUser(Long id, String username) {
        return findForUser(id, username).map(e -> {
            repo.deleteById(e.getId());
            return true;
        }).orElse(false);
    }
}