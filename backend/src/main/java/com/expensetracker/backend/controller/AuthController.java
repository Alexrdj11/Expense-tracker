package com.expensetracker.backend.controller;

import com.expensetracker.backend.security.JwtService;
import com.expensetracker.backend.service.AppUserService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AppUserService users;
    private final JwtService jwt;

    public AuthController(AppUserService users, JwtService jwt) {
        this.users = users;
        this.jwt = jwt;
    }

    public static class LoginRequest {
        @NotBlank public String username;
        @NotBlank public String password;
        public String getUsername() { return username; }
        public String getPassword() { return password; }
        public void setUsername(String username) { this.username = username; }
        public void setPassword(String password) { this.password = password; }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        return users.authenticate(req.getUsername(), req.getPassword())
                .map(u -> ResponseEntity.ok(Map.of("token", jwt.generateToken(u.getUsername()))))
                .orElseGet(() -> ResponseEntity.status(401).body(Map.of("error", "Invalid credentials")));
    }
}