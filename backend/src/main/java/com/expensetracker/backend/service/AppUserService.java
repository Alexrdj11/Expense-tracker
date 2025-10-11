package com.expensetracker.backend.service;

import com.expensetracker.backend.model.AppUser;
import com.expensetracker.backend.repository.AppUserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AppUserService {

    private final AppUserRepository repo;
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    public AppUserService(AppUserRepository repo) {
        this.repo = repo;
    }

    public AppUser register(String username, String rawPassword) {
        if (repo.existsByUsername(username)) {
            throw new IllegalArgumentException("Username already taken");
        }
        String hash = encoder.encode(rawPassword);
        return repo.save(new AppUser(username, hash));
    }

    public Optional<AppUser> authenticate(String username, String rawPassword) {
        return repo.findByUsername(username)
                .filter(u -> encoder.matches(rawPassword, u.getPasswordHash()));
    }

    public Optional<AppUser> find(Long id) {
        return repo.findById(id);
    }

    public List<AppUser> list() {
        return repo.findAll();
    }
}