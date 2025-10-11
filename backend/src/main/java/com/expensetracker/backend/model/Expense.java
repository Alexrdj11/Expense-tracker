package com.expensetracker.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Table("expense")
public class Expense {

    @Id
    private Long id;

    @NotBlank(message = "Description required")
    private String description;

    @NotNull(message = "Amount required")
    @Positive(message = "Amount must be > 0")
    private BigDecimal amount;

    @NotBlank(message = "Category required")
    private String category;

    @NotNull(message = "Expense date required")
    @Column("expense_date")
    private LocalDate expenseDate;

    @ReadOnlyProperty
    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("user_id")
    private Long userId;

    public Expense() {}

    public Expense(String description, BigDecimal amount, String category, LocalDate expenseDate) {
        this.description = description;
        this.amount = amount;
        this.category = category;
        this.expenseDate = expenseDate;
    }

    public Long getId() { return id; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}