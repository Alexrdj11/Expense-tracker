package com.expensetracker.backend.service;

import com.expensetracker.backend.model.Expense;
import com.expensetracker.backend.repository.ExpenseRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository repo;

    public ExpenseService(ExpenseRepository repo) {
        this.repo = repo;
    }

    public List<Expense> listAll() {
        return repo.findAll();
    }

    public Optional<Expense> find(Long id) {
        return repo.findById(id);
    }

    public Expense create(Expense e) {
        return repo.save(e);
    }

    public Optional<Expense> update(Long id, Expense incoming) {
        return repo.findById(id).map(e -> {
            e.setDescription(incoming.getDescription());
            e.setAmount(incoming.getAmount());
            e.setCategory(incoming.getCategory());
            e.setExpenseDate(incoming.getExpenseDate());
            return repo.save(e);
        });
    }

    public boolean delete(Long id) {
        if (repo.existsById(id)) {
            repo.deleteById(id);
            return true;
        }
        return false;
    }
}