package com.expensetracker.backend.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.relational.core.mapping.Column;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Table("app_user")
public class AppUser {

    @Id
    private Long id;

    @NotBlank
    @Size(max = 50)
    private String username;

    @Column("password_hash")
    private String passwordHash;

    public AppUser() {}

    public AppUser(String username, String passwordHash) {
        this.username = username;
        this.passwordHash = passwordHash;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getPasswordHash() { return passwordHash; }
    public void setUsername(String username) { this.username = username; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public void setFullName(String name) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setFullName'");
    }

    public void setProvider(String string) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setProvider'");
    }

    public void setExternalId(String sub) {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'setExternalId'");
    }
}