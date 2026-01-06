package com.unt.academic_system.controller;

import com.unt.academic_system.model.AcademicYear;
import com.unt.academic_system.service.AcademicYearService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/academic-years")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AcademicYearController {

    private final AcademicYearService academicYearService;

    @PostMapping
    public ResponseEntity<?> createAcademicYear(@RequestBody AcademicYear academicYear) {
        try {
            AcademicYear created = academicYearService.createAcademicYear(academicYear);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAcademicYearById(@PathVariable Long id) {
        Optional<AcademicYear> academicYear = academicYearService.findById(id);
        return academicYear.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/code/{yearCode}")
    public ResponseEntity<?> getAcademicYearByCode(@PathVariable String yearCode) {
        Optional<AcademicYear> academicYear = academicYearService.findByYearCode(yearCode);
        return academicYear.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping("/current")
    public ResponseEntity<?> getCurrentAcademicYear() {
        Optional<AcademicYear> academicYear = academicYearService.getCurrentAcademicYear();
        if (academicYear.isPresent()) {
            return ResponseEntity.ok(academicYear.get());
        } else {
            // Retourner une année académique par défaut au lieu de 404
            AcademicYear defaultYear = createDefaultAcademicYear();
            return ResponseEntity.ok(defaultYear);
        }
    }


    private AcademicYear createDefaultAcademicYear() {
        AcademicYear defaultYear = new AcademicYear();
        int currentYear = java.time.Year.now().getValue();
        defaultYear.setYearCode(String.valueOf(currentYear));
        defaultYear.setStartDate(LocalDate.of(currentYear, 1, 1));
        defaultYear.setEndDate(LocalDate.of(currentYear, 12, 31));
        defaultYear.setRegistrationStartDate(LocalDate.of(currentYear, 1, 1));
        defaultYear.setRegistrationEndDate(LocalDate.of(currentYear, 2, 28));
        defaultYear.setExamStartDate(LocalDate.of(currentYear, 11, 1));
        defaultYear.setExamEndDate(LocalDate.of(currentYear, 12, 15));
        defaultYear.setSemester(1);
        defaultYear.setIsActive(true);  // ✅ Changé de setActive à setIsActive
        defaultYear.setIsCurrent(false); // ✅ Changé de setCurrent à setIsCurrent
        return defaultYear;
    }

    @GetMapping
    public ResponseEntity<List<AcademicYear>> getAllAcademicYears() {
        return ResponseEntity.ok(academicYearService.getAllAcademicYears());
    }

    @GetMapping("/active")
    public ResponseEntity<List<AcademicYear>> getActiveAcademicYears() {
        return ResponseEntity.ok(academicYearService.getActiveAcademicYears());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateAcademicYear(@PathVariable Long id, @RequestBody AcademicYear academicYear) {
        try {
            AcademicYear updated = academicYearService.updateAcademicYear(id, academicYear);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/set-current")
    public ResponseEntity<?> setCurrentAcademicYear(@PathVariable Long id) {
        try {
            academicYearService.setCurrentAcademicYear(id);
            return ResponseEntity.ok("Academic year set as current");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/activate")
    public ResponseEntity<?> activateAcademicYear(@PathVariable Long id) {
        try {
            academicYearService.activateAcademicYear(id);
            return ResponseEntity.ok("Academic year activated");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<?> deactivateAcademicYear(@PathVariable Long id) {
        try {
            academicYearService.deactivateAcademicYear(id);
            return ResponseEntity.ok("Academic year deactivated");
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAcademicYear(@PathVariable Long id) {
        try {
            academicYearService.deleteAcademicYear(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }
}