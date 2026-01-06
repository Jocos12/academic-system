package com.unt.academic_system.controller;

import com.unt.academic_system.dto.EnrollmentCreateDTO;
import com.unt.academic_system.dto.EnrollmentDTO;
import com.unt.academic_system.dto.EnrollmentUpdateDTO;
import com.unt.academic_system.dto.GradeUpdateDTO;
import com.unt.academic_system.model.EnrollmentStatus;
import com.unt.academic_system.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    /**
     * Get all enrollments
     * GET /api/enrollments
     */
    @GetMapping
    public ResponseEntity<?> getAllEnrollments() {
        try {
            List<EnrollmentDTO> enrollments = enrollmentService.findAll();
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching enrollments: " + e.getMessage()));
        }
    }

    /**
     * Enroll a student in a course
     * POST /api/enrollments/enroll
     */
    @PostMapping("/enroll")
    public ResponseEntity<?> enrollStudent(@Valid @RequestBody EnrollmentCreateDTO enrollmentCreateDTO) {
        try {
            EnrollmentDTO enrollment = enrollmentService.enrollStudent(enrollmentCreateDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(enrollment);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get enrollment by ID
     * GET /api/enrollments/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getEnrollmentById(@PathVariable Long id) {
        try {
            Optional<EnrollmentDTO> enrollment = enrollmentService.findById(id);
            return enrollment.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching enrollment: " + e.getMessage()));
        }
    }

    /**
     * Get all enrollments for a specific student
     * GET /api/enrollments/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentEnrollments(@PathVariable Long studentId) {
        try {
            List<EnrollmentDTO> enrollments = enrollmentService.getStudentEnrollments(studentId);
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching student enrollments: " + e.getMessage()));
        }
    }

    /**
     * Get all enrollments for a specific course
     * GET /api/enrollments/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getCourseEnrollments(@PathVariable Long courseId) {
        try {
            List<EnrollmentDTO> enrollments = enrollmentService.getCourseEnrollments(courseId);
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching course enrollments: " + e.getMessage()));
        }
    }

    /**
     * Get enrollments by status
     * GET /api/enrollments/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<?> getEnrollmentsByStatus(@PathVariable EnrollmentStatus status) {
        try {
            List<EnrollmentDTO> enrollments = enrollmentService.getEnrollmentsByStatus(status);
            return ResponseEntity.ok(enrollments);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching enrollments by status: " + e.getMessage()));
        }
    }

    /**
     * Get student transcript (completed courses)
     * GET /api/enrollments/student/{studentId}/transcript
     */
    @GetMapping("/student/{studentId}/transcript")
    public ResponseEntity<?> getStudentTranscript(@PathVariable Long studentId) {
        try {
            List<EnrollmentDTO> transcript = enrollmentService.getStudentTranscript(studentId);
            return ResponseEntity.ok(transcript);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching transcript: " + e.getMessage()));
        }
    }

    /**
     * Calculate current semester credits for a student
     * GET /api/enrollments/student/{studentId}/credits/{academicYear}/{semester}
     */
    @GetMapping("/student/{studentId}/credits/{academicYear}/{semester}")
    public ResponseEntity<?> calculateCurrentCredits(
            @PathVariable Long studentId,
            @PathVariable String academicYear,
            @PathVariable Integer semester) {
        try {
            Integer credits = enrollmentService.calculateCurrentCredits(studentId, academicYear, semester);
            return ResponseEntity.ok(Map.of(
                    "studentId", studentId,
                    "academicYear", academicYear,
                    "semester", semester,
                    "totalCredits", credits
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error calculating credits: " + e.getMessage()));
        }
    }

    /**
     * Calculate student GPA
     * GET /api/enrollments/student/{studentId}/gpa
     */
    @GetMapping("/student/{studentId}/gpa")
    public ResponseEntity<?> calculateGPA(@PathVariable Long studentId) {
        try {
            Double gpa = enrollmentService.calculateGPA(studentId);
            return ResponseEntity.ok(Map.of(
                    "studentId", studentId,
                    "gpa", gpa
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error calculating GPA: " + e.getMessage()));
        }
    }

    /**
     * Update enrollment
     * PUT /api/enrollments/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateEnrollment(
            @PathVariable Long id,
            @Valid @RequestBody EnrollmentUpdateDTO enrollmentUpdateDTO) {
        try {
            EnrollmentDTO updated = enrollmentService.updateEnrollment(id, enrollmentUpdateDTO);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Drop a course
     * PUT /api/enrollments/{id}/drop
     */
    @PutMapping("/{id}/drop")
    public ResponseEntity<?> dropCourse(@PathVariable Long id) {
        try {
            enrollmentService.dropCourse(id);
            return ResponseEntity.ok(Map.of("message", "Course dropped successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update grades for an enrollment
     * PUT /api/enrollments/{id}/grade
     */
    @PutMapping("/{id}/grade")
    public ResponseEntity<?> updateGrade(
            @PathVariable Long id,
            @Valid @RequestBody GradeUpdateDTO gradeUpdateDTO) {
        try {
            EnrollmentDTO updated = enrollmentService.updateGrade(
                    id,
                    gradeUpdateDTO.getMidterm(),
                    gradeUpdateDTO.getFinalGrade()
            );
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update attendance for an enrollment
     * PUT /api/enrollments/{id}/attendance
     */
    @PutMapping("/{id}/attendance")
    public ResponseEntity<?> updateAttendance(
            @PathVariable Long id,
            @RequestParam Integer attendance) {
        try {
            EnrollmentDTO updated = enrollmentService.updateAttendance(id, attendance);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark enrollment as paid
     * PUT /api/enrollments/{id}/mark-paid
     */
    @PutMapping("/{id}/mark-paid")
    public ResponseEntity<?> markAsPaid(@PathVariable Long id) {
        try {
            EnrollmentDTO updated = enrollmentService.markAsPaid(id);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete an enrollment
     * DELETE /api/enrollments/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEnrollment(@PathVariable Long id) {
        try {
            enrollmentService.deleteEnrollment(id);
            return ResponseEntity.ok(Map.of("message", "Enrollment deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }
}