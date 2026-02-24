package com.example.controller;

import com.example.DAO.UserRepository;
import com.example.bean.User;
import com.example.dto.LoginRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
public class AuthController {

    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public AuthController(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo;
        this.encoder = encoder;
    }

    @GetMapping("/home")
    public ResponseEntity<?> gethome() {
        return ResponseEntity.ok("welcome to homepage");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginRequest req,
            HttpServletRequest request,
            HttpServletResponse response) {
        User user = repo.findByUsername(req.username())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

        if (!encoder.matches(req.password(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        // 1️⃣ Create Authentication (with roles)
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole())));

        // 2️⃣ Create SecurityContext
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);

        // 3️⃣ Force session creation
        request.getSession(true);

        // 4️⃣ Persist SecurityContext properly
        HttpSessionSecurityContextRepository securityContextRepo = new HttpSessionSecurityContextRepository();

        securityContextRepo.saveContext(context, request, response);

        Map<String, Object> profile = new HashMap<>();
        profile.put("username", user.getUsername());
        profile.put("role", user.getRole());
        profile.put("email", user.getEmail());

        return ResponseEntity.ok(profile);
    }

    @GetMapping("/api/auth/profile")
    public ResponseEntity<?> getProfile() {
        SecurityContext context = SecurityContextHolder.getContext();
        org.springframework.security.core.Authentication authentication = context.getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || "anonymousUser".equals(authentication.getPrincipal())) {
            return ResponseEntity.status(401).body("Not authenticated");
        }

        String username = authentication.getName();
        Optional<User> userOpt = repo.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            Map<String, Object> profile = new HashMap<>();
            profile.put("username", user.getUsername());
            profile.put("role", user.getRole());
            profile.put("email", user.getEmail());
            return ResponseEntity.ok(profile);
        }
        return ResponseEntity.status(401).body("User not found");
    }

}
