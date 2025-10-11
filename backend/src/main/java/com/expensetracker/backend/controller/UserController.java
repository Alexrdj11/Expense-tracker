package com.expensetracker.backend.controller;

import com.expensetracker.backend.model.AppUser;
import com.expensetracker.backend.service.AppUserService;
import com.expensetracker.backend.controller.dto.UserRegistrationRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final AppUserService service;

    public UserController(AppUserService service) {
        this.service = service;
    }

    @PostMapping("/register")
    public ResponseEntity<AppUser> register(@Valid @RequestBody UserRegistrationRequest req) {
        AppUser saved = service.register(req.getUsername(), req.getPassword());
        return ResponseEntity.created(URI.create("/api/users/" + saved.getId())).body(mask(saved));
    }

    @GetMapping
    public List<AppUser> list() {
        return service.list().stream().map(this::mask).toList();
    }

    private AppUser mask(AppUser u) {
        // Return a copy with password hash nulled (simple approach)
        AppUser copy = new AppUser(u.getUsername(), null);
        try {
            var idField = AppUser.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(copy, u.getId());
        } catch (Exception ignored) {}
        return copy;
    }
}