package com.expensetracker.backend.service;

import com.expensetracker.backend.model.AppUser;
import com.expensetracker.backend.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class AppUserService {
  private final AppUserRepository repo;
  private final PasswordEncoder encoder;

  public AppUserService(AppUserRepository repo, PasswordEncoder encoder) {
    this.repo = repo;
    this.encoder = encoder;
  }

  public Optional<AppUser> authenticate(String username, String rawPassword) {
    return repo.findByUsername(username)
        .filter(
            u -> {
              String hash = u.getPasswordHash(); // ensure AppUser has getPasswordHash()
              return hash != null && encoder.matches(rawPassword, hash);
            });
  }

  // Optional helper if you kept it; safe no-op if unused.
  public void ensureUser(String email, String name) {
    if (repo.findByUsername(email).isPresent()) return;
    AppUser u = new AppUser();
    u.setUsername(email);
    u.setFullName(name);
    // set any default/placeholder password if required by schema
    u.setPasswordHash(encoder.encode(java.util.UUID.randomUUID().toString()));
    repo.save(u);
  }

  public AppUser register(String username, String password) {
    if (username == null || username.isBlank()) throw new IllegalArgumentException("Username required");
    if (password == null || password.length() < 6) throw new IllegalArgumentException("Password must be at least 6 characters");
    if (repo.findByUsername(username).isPresent()) throw new IllegalArgumentException("Username already taken");
    AppUser u = new AppUser();
    u.setUsername(username);
    u.setPasswordHash(encoder.encode(password));
    return repo.save(u);
  }

  public Collection<AppUser> list() {
    return (Collection<AppUser>) repo.findAll();
  }
}