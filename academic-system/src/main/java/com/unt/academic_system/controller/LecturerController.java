package com.unt.academic_system.controller;

import com.unt.academic_system.dto.CourseDTO;
import com.unt.academic_system.dto.LecturerDTO;
import com.unt.academic_system.model.Course;
import com.unt.academic_system.model.Lecturer;
import com.unt.academic_system.repository.CourseRepository;
import com.unt.academic_system.service.LecturerService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lecturers")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LecturerController {

    private static final Logger logger = LoggerFactory.getLogger(LecturerController.class);

    private final LecturerService lecturerService;
    private final CourseRepository courseRepository;

    @PostMapping("/register")
    public ResponseEntity<?> registerLecturer(@RequestBody Lecturer lecturer) {
        try {
            logger.info("📝 Register request for: {}", lecturer.getEmail());
            Lecturer registered = lecturerService.registerLecturer(lecturer);

            LecturerDTO dto = new LecturerDTO(registered);
            // Get course count from database
            List<Course> courses = courseRepository.findByLecturerId(registered.getId());
            dto.setCourseCount(courses.size());

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Registration failed: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }


    @GetMapping
    public ResponseEntity<?> getAllLecturers() {
        try {
            logger.info("📋 Fetching all lecturers");
            List<Lecturer> lecturers = lecturerService.getAllLecturers();

            List<LecturerDTO> dtos = lecturers.stream()
                    .map(lecturer -> {
                        LecturerDTO dto = new LecturerDTO(lecturer);

                        // ✅ CORRECTION CRITIQUE: Charger les cours depuis la base de données
                        List<Course> courses = courseRepository.findByLecturerId(lecturer.getId());

                        logger.debug("📊 Lecturer {} ({}) has {} courses in database",
                                lecturer.getId(),
                                lecturer.getEmployeeId(),
                                courses.size());

                        // ✅ Définir le nombre de cours dans le DTO
                        dto.setCourseCount(courses.size());

                        // ✅ IMPORTANT: Ajouter la liste des cours au DTO si nécessaire
                        if (!courses.isEmpty()) {
                            // Convertir les cours en DTOs simples pour éviter les problèmes de sérialisation
                            dto.setCourses(courses.stream()
                                    .map(c -> {
                                        LecturerDTO.SimpleCourseDTO courseDTO = new LecturerDTO.SimpleCourseDTO();
                                        courseDTO.setId(c.getId());
                                        courseDTO.setCourseCode(c.getCourseCode());
                                        courseDTO.setCourseName(c.getCourseName());
                                        return courseDTO;
                                    })
                                    .collect(Collectors.toList()));
                        }

                        return dto;
                    })
                    .collect(Collectors.toList());

            logger.info("✅ Found {} lecturers", dtos.size());

            // Log détaillé pour debug
            for (LecturerDTO dto : dtos) {
                logger.debug("   - Lecturer {}: {} courses", dto.getEmployeeId(), dto.getCourseCount());
            }

            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            logger.error("❌ Error fetching lecturers: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch lecturers: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }



    @GetMapping("/{id}")
    public ResponseEntity<?> getLecturerById(@PathVariable Long id) {
        try {
            logger.info("🔍 Fetching lecturer with ID: {}", id);
            Lecturer lecturer = lecturerService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Lecturer not found"));

            LecturerDTO dto = new LecturerDTO(lecturer);

            // ✅ CORRECTION CRITIQUE: Charger les cours depuis la base de données
            List<Course> courses = courseRepository.findByLecturerId(id);

            logger.info("📊 Lecturer {} has {} courses in database", id, courses.size());

            // ✅ Définir le nombre de cours
            dto.setCourseCount(courses.size());

            // ✅ IMPORTANT: Ajouter la liste des cours au DTO
            if (!courses.isEmpty()) {
                dto.setCourses(courses.stream()
                        .map(c -> {
                            LecturerDTO.SimpleCourseDTO courseDTO = new LecturerDTO.SimpleCourseDTO();
                            courseDTO.setId(c.getId());
                            courseDTO.setCourseCode(c.getCourseCode());
                            courseDTO.setCourseName(c.getCourseName());
                            return courseDTO;
                        })
                        .collect(Collectors.toList()));

                logger.info("✅ Added {} courses to DTO", courses.size());
                for (Course c : courses) {
                    logger.info("   - Course: {} - {}", c.getCourseCode(), c.getCourseName());
                }
            }

            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/employee/{employeeId}")
    public ResponseEntity<?> getLecturerByEmployeeId(@PathVariable String employeeId) {
        try {
            logger.info("🔍 Fetching lecturer with employee ID: {}", employeeId);
            Lecturer lecturer = lecturerService.findByEmployeeId(employeeId)
                    .orElseThrow(() -> new RuntimeException("Lecturer not found"));

            LecturerDTO dto = new LecturerDTO(lecturer);
            List<Course> courses = courseRepository.findByLecturerId(lecturer.getId());
            dto.setCourseCount(courses.size());

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/email/{email}")
    public ResponseEntity<?> getLecturerByEmail(@PathVariable String email) {
        try {
            logger.info("🔍 Fetching lecturer with email: {}", email);
            Lecturer lecturer = lecturerService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Lecturer not found"));

            LecturerDTO dto = new LecturerDTO(lecturer);
            List<Course> courses = courseRepository.findByLecturerId(lecturer.getId());
            dto.setCourseCount(courses.size());

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        }
    }

    @GetMapping("/{id}/courses")
    public ResponseEntity<?> getLecturerCourses(@PathVariable Long id) {
        try {
            logger.info("📚 Fetching courses for lecturer: {}", id);

            // Verify lecturer exists
            lecturerService.findById(id)
                    .orElseThrow(() -> new RuntimeException("Lecturer not found"));

            // Get courses from database directly
            List<Course> courses = courseRepository.findByLecturerId(id);

            List<CourseDTO> courseDTOs = courses.stream()
                    .map(CourseDTO::fromEntity)
                    .collect(Collectors.toList());

            logger.info("✅ Found {} courses for lecturer {}", courseDTOs.size(), id);
            return ResponseEntity.ok(courseDTOs);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateLecturer(@PathVariable Long id, @RequestBody Lecturer lecturer) {
        try {
            logger.info("✏️ Updating lecturer: {}", id);
            Lecturer updated = lecturerService.updateLecturer(id, lecturer);

            LecturerDTO dto = new LecturerDTO(updated);
            List<Course> courses = courseRepository.findByLecturerId(id);
            dto.setCourseCount(courses.size());

            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            logger.error("❌ Update failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @PostMapping("/{lecturerId}/courses/{courseId}")
    public ResponseEntity<?> assignCourse(@PathVariable Long lecturerId, @PathVariable Long courseId) {
        try {
            logger.info("🔗 Assigning course {} to lecturer {}", courseId, lecturerId);
            lecturerService.assignCourse(lecturerId, courseId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Course assigned successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Assignment failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }



    @PostMapping("/{lecturerId}/courses/assign-multiple")
    public ResponseEntity<?> assignMultipleCourses(
            @PathVariable Long lecturerId,
            @RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> courseIds = request.get("courseIds");

            logger.info("🔵 ========================================");
            logger.info("🔵 CONTROLLER: Received course assignment request");
            logger.info("🔵 Lecturer ID: {}", lecturerId);
            logger.info("🔵 Course IDs from request: {}", courseIds);
            logger.info("🔵 Number of courses: {}", courseIds != null ? courseIds.size() : 0);
            logger.info("🔵 ========================================");

            // USE NATIVE SQL VERSION
            lecturerService.assignMultipleCoursesNative(lecturerId, courseIds);

            // VERIFICATION IMMÉDIATE
            logger.info("🔍 CONTROLLER: Verifying assignment after service call...");
            List<Course> verificationCourses = courseRepository.findByLecturerId(lecturerId);
            logger.info("🔍 CONTROLLER: Found {} courses for lecturer {} in DB",
                    verificationCourses.size(), lecturerId);

            for (Course c : verificationCourses) {
                logger.info("   ✓ Course: {} - {} (Lecturer ID: {})",
                        c.getCourseCode(),
                        c.getCourseName(),
                        c.getLecturer() != null ? c.getLecturer().getId() : "NULL");
            }

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Courses assigned successfully");
            response.put("assignedCount", courseIds.size());

            logger.info("✅ CONTROLLER: Returning success response");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("❌ CONTROLLER: Multiple assignment failed");
            logger.error("❌ Error type: {}", e.getClass().getName());
            logger.error("❌ Error message: {}", e.getMessage());
            logger.error("❌ Stack trace:", e);

            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{lecturerId}/courses/{courseId}")
    public ResponseEntity<?> unassignCourse(@PathVariable Long lecturerId, @PathVariable Long courseId) {
        try {
            logger.info("🔓 Unassigning course {} from lecturer {}", courseId, lecturerId);
            lecturerService.unassignCourse(lecturerId, courseId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Course unassigned successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Unassignment failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLecturer(@PathVariable Long id) {
        try {
            logger.info("🗑️ Deleting lecturer: {}", id);
            lecturerService.deleteLecturer(id);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Lecturer deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("❌ Deletion failed: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }

    @GetMapping("/department/{department}")
    public ResponseEntity<?> getLecturersByDepartment(@PathVariable String department) {
        try {
            logger.info("🔍 Fetching lecturers in department: {}", department);
            List<Lecturer> lecturers = lecturerService.getLecturersByDepartment(department);

            List<LecturerDTO> dtos = lecturers.stream()
                    .map(lecturer -> {
                        LecturerDTO dto = new LecturerDTO(lecturer);
                        List<Course> courses = courseRepository.findByLecturerId(lecturer.getId());
                        dto.setCourseCount(courses.size());
                        return dto;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            logger.error("❌ Error: {}", e.getMessage());
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}