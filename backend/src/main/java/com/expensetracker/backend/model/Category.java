package com.expensetracker.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.ReadOnlyProperty;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Table("category")
public class Category {

    @Id
    private Long id;

    @NotBlank(message = "Name required")
    private String name;

    @Column("user_id")
    private Long userId;

    @ReadOnlyProperty
    @Column("created_at")
    private LocalDateTime createdAt;

    public Category() {}

    public Category(String name) {
        this.name = name;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}


