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

    @NotNull(message = "CategoryId required")
    @Column("category_id")
    private Long categoryId;

    @NotNull(message = "Expense date required")
    @Column("expense_date")
    private LocalDate expenseDate;

    @ReadOnlyProperty
    @Column("created_at")
    private LocalDateTime createdAt;

    @Column("user_id")
    private Long userId;

    public Expense() {}

    public Expense(String description, BigDecimal amount, Long categoryId, LocalDate expenseDate) {
        this.description = description;
        this.amount = amount;
        this.categoryId = categoryId;
        this.expenseDate = expenseDate;
    }

    public Long getId() { return id; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public Long getCategoryId() { return categoryId; }
    public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
}