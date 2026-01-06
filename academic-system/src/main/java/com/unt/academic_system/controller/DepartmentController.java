package com.unt.academic_system.controller;

import com.unt.academic_system.dto.DepartmentDTO;
import com.unt.academic_system.model.Department;
import com.unt.academic_system.model.Faculty;
import com.unt.academic_system.service.DepartmentService;
import com.unt.academic_system.service.FacultyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class DepartmentController {

    private final DepartmentService departmentService;
    private final FacultyService facultyService;

    @PostMapping
    public ResponseEntity<?> createDepartment(@RequestBody Map<String, Object> payload) {
        try {
            Department department = new Department();
            department.setName((String) payload.get("name"));
            department.setCode((String) payload.get("code"));
            department.setDescription((String) payload.get("description"));

            Object isActiveObj = payload.get("isActive");
            if (isActiveObj != null) {
                department.setIsActive(Boolean.parseBoolean(isActiveObj.toString()));
            } else {
                department.setIsActive(true);
            }

            Object facultyIdObj = payload.get("facultyId");
            if (facultyIdObj != null) {
                Long facultyId = facultyIdObj instanceof Integer ?
                        ((Integer) facultyIdObj).longValue() :
                        (Long) facultyIdObj;
                Optional<Faculty> faculty = facultyService.findById(facultyId);
                if (faculty.isPresent()) {
                    department.setFaculty(faculty.get());
                } else {
                    return ResponseEntity.badRequest().body("Faculty not found");
                }
            }

            Department created = departmentService.createDepartment(department);
            return ResponseEntity.status(HttpStatus.CREATED).body(new DepartmentDTO(created));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDepartmentById(@PathVariable Long id) {
        Optional<Department> department = departmentService.findById(id);
        return department.map(dept -> ResponseEntity.ok(new DepartmentDTO(dept)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> getDepartmentByCode(@PathVariable String code) {
        Optional<Department> department = departmentService.findByCode(code);
        return department.map(dept -> ResponseEntity.ok(new DepartmentDTO(dept)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping
    public ResponseEntity<List<DepartmentDTO>> getAllDepartments() {
        List<Department> departments = departmentService.getAllDepartments();
        List<DepartmentDTO> dtos = departments.stream()
                .map(DepartmentDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/faculty/{facultyId}")
    public ResponseEntity<List<DepartmentDTO>> getDepartmentsByFaculty(@PathVariable Long facultyId) {
        List<Department> departments = departmentService.getDepartmentsByFaculty(facultyId);
        List<DepartmentDTO> dtos = departments.stream()
                .map(DepartmentDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @GetMapping("/active")
    public ResponseEntity<List<DepartmentDTO>> getActiveDepartments() {
        List<Department> departments = departmentService.getActiveDepartments();
        List<DepartmentDTO> dtos = departments.stream()
                .map(DepartmentDTO::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDepartment(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        try {
            Optional<Department> existingDept = departmentService.findById(id);
            if (existingDept.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Department not found");
            }

            Department department = existingDept.get();

            if (payload.containsKey("name")) {
                department.setName((String) payload.get("name"));
            }
            if (payload.containsKey("code")) {
                department.setCode((String) payload.get("code"));
            }
            if (payload.containsKey("description")) {
                department.setDescription((String) payload.get("description"));
            }
            if (payload.containsKey("isActive")) {
                department.setIsActive(Boolean.parseBoolean(payload.get("isActive").toString()));
            }

            if (payload.containsKey("facultyId")) {
                Object facultyIdObj = payload.get("facultyId");
                if (facultyIdObj != null) {
                    Long facultyId = facultyIdObj instanceof Integer ?
                            ((Integer) facultyIdObj).longValue() :
                            (Long) facultyIdObj;
                    Optional<Faculty> faculty = facultyService.findById(facultyId);
                    if (faculty.isPresent()) {
                        department.setFaculty(faculty.get());
                    }
                }
            }

            Department updated = departmentService.updateDepartment(id, department);
            return ResponseEntity.ok(new DepartmentDTO(updated));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDepartment(@PathVariable Long id) {
        try {
            departmentService.deleteDepartment(id);
            return ResponseEntity.ok("Department deleted successfully");  // Changed from "deactivated" to "deleted"
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{departmentId}/assign-head/{lecturerId}")
    public ResponseEntity<?> assignHead(@PathVariable Long departmentId, @PathVariable Long lecturerId) {
        try {
            departmentService.assignHead(departmentId, lecturerId);
            return ResponseEntity.ok("Department head assigned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}