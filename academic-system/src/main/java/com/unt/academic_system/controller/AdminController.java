package com.unt.academic_system.controller;

import com.unt.academic_system.model.UserRole;
import com.unt.academic_system.model.Admin;
import com.unt.academic_system.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.security.Principal;

@RestController
@RequestMapping("/api/admins")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminController {

    private final AdminService adminService;

    @PostMapping("/register")
    public ResponseEntity<?> registerAdmin(@RequestBody Admin admin) {
        try {
            System.out.println("Received admin registration request: " + admin);

            // Ensure role is set
            if (admin.getRole() == null) {
                admin.setRole(UserRole.ADMIN);
            }

            Admin registered = adminService.registerAdmin(admin);
            return ResponseEntity.status(HttpStatus.CREATED).body(registered);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: " + e.getMessage());
        }
    }

    // In AdminController.java

    @GetMapping("/current")
    public ResponseEntity<Admin> getCurrentAdmin(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String email = principal.getName(); // Assuming username is email
        Admin admin = adminService.findByEmail(email);

        if (admin == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        return ResponseEntity.ok(admin);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAdminById(@PathVariable Long id) {
        Optional<Admin> admin = adminService.findById(id);
        return admin.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getAdminByEmployeeId(@PathVariable String employeeId) {
        Optional<Admin> admin = adminService.findByEmployeeId(employeeId);
        return admin.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping
    public ResponseEntity<List<Admin>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<List<Admin>> getAdminsByDepartment(@PathVariable String department) {
        return ResponseEntity.ok(adminService.getAdminsByDepartment(department));
    }

    @GetMapping("/access-level/{accessLevel}")
    public ResponseEntity<List<Admin>> getAdminsByAccessLevel(@PathVariable String accessLevel) {
        return ResponseEntity.ok(adminService.getAdminsByAccessLevel(accessLevel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAdmin(@PathVariable Long id, @RequestBody Admin admin) {
        try {
            Admin updated = adminService.updateAdmin(id, admin);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}