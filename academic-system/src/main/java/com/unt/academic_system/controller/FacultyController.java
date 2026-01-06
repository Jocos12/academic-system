package com.unt.academic_system.controller;

import com.unt.academic_system.dto.FacultyDTO;
import com.unt.academic_system.model.Faculty;
import com.unt.academic_system.service.FacultyService;
import com.unt.academic_system.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/faculties")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class FacultyController {

    private final FacultyService facultyService;
    private final DepartmentRepository departmentRepository;

    @PostMapping
    public ResponseEntity<?> createFaculty(@RequestBody Faculty faculty) {
        try {
            Faculty created = facultyService.createFaculty(faculty);
            int deptCount = departmentRepository.countByFacultyId(created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(new FacultyDTO(created, deptCount));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getFacultyById(@PathVariable Long id) {
        Optional<Faculty> faculty = facultyService.findById(id);
        if (faculty.isPresent()) {
            int deptCount = departmentRepository.countByFacultyId(id);
            return ResponseEntity.ok(new FacultyDTO(faculty.get(), deptCount));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping("/code/{code}")
    public ResponseEntity<?> getFacultyByCode(@PathVariable String code) {
        Optional<Faculty> faculty = facultyService.findByCode(code);
        if (faculty.isPresent()) {
            int deptCount = departmentRepository.countByFacultyId(faculty.get().getId());
            return ResponseEntity.ok(new FacultyDTO(faculty.get(), deptCount));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
    }

    @GetMapping
    public ResponseEntity<List<FacultyDTO>> getAllFaculties() {
        List<Faculty> faculties = facultyService.getAllFaculties();
        List<FacultyDTO> facultyDTOs = faculties.stream()
                .map(f -> new FacultyDTO(f, departmentRepository.countByFacultyId(f.getId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(facultyDTOs);
    }

    @GetMapping("/active")
    public ResponseEntity<List<FacultyDTO>> getActiveFaculties() {
        List<Faculty> faculties = facultyService.getActiveFaculties();
        List<FacultyDTO> facultyDTOs = faculties.stream()
                .map(f -> new FacultyDTO(f, departmentRepository.countByFacultyId(f.getId())))
                .collect(Collectors.toList());
        return ResponseEntity.ok(facultyDTOs);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFaculty(@PathVariable Long id, @RequestBody Faculty faculty) {
        try {
            Faculty updated = facultyService.updateFaculty(id, faculty);
            int deptCount = departmentRepository.countByFacultyId(id);
            return ResponseEntity.ok(new FacultyDTO(updated, deptCount));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFaculty(@PathVariable Long id) {
        try {
            facultyService.deleteFaculty(id);
            return ResponseEntity.ok("Faculty deactivated successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{facultyId}/assign-dean/{lecturerId}")
    public ResponseEntity<?> assignDean(@PathVariable Long facultyId, @PathVariable Long lecturerId) {
        try {
            facultyService.assignDean(facultyId, lecturerId);
            return ResponseEntity.ok("Dean assigned successfully");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}