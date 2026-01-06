package com.unt.academic_system.controller;

import com.unt.academic_system.dto.ParentResponseDTO;
import com.unt.academic_system.model.Parent;
import com.unt.academic_system.service.ParentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parents")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ParentController {

    private final ParentService parentService;

    @PostMapping("/register")
    public ResponseEntity<?> registerParent(@RequestBody Parent parent) {
        try {
            Parent registered = parentService.registerParent(parent);
            return ResponseEntity.status(HttpStatus.CREATED).body(registered);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getParentById(@PathVariable Long id) {
        try {
            System.out.println("=== Fetching parent with ID: " + id);

            ParentResponseDTO response = parentService.getParentWithDetails(id);

            if (response == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", true);
                errorResponse.put("message", "Parent not found");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
            }

            if (response.getChildren() == null || response.getChildren().isEmpty()) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("error", true);
                errorResponse.put("message", "No student linked to this parent account");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
            }

            System.out.println("=== Successfully returning parent data ===");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            System.err.println("=== ERROR in ParentController ===");
            e.printStackTrace();

            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", true);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("type", e.getClass().getName());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    @GetMapping
    public ResponseEntity<List<Parent>> getAllParents() {
        return ResponseEntity.ok(parentService.getAllParents());
    }

    @GetMapping("/relationship/{relationship}")
    public ResponseEntity<List<Parent>> getParentsByRelationship(@PathVariable String relationship) {
        return ResponseEntity.ok(parentService.getParentsByRelationship(relationship));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateParent(@PathVariable Long id, @RequestBody Parent parent) {
        try {
            Parent updated = parentService.updateParent(id, parent);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}