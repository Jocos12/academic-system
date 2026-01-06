package com.unt.academic_system.controller;

import com.unt.academic_system.dto.CourseCreateDTO;
import com.unt.academic_system.dto.CourseDTO;
import com.unt.academic_system.dto.CourseUpdateDTO;
import com.unt.academic_system.service.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CourseController {

    private final CourseService courseService;

    /**
     * Create a new course
     * POST /api/courses
     */
    @PostMapping
    public ResponseEntity<?> createCourse(@Valid @RequestBody CourseCreateDTO courseCreateDTO) {
        try {
            CourseDTO created = courseService.createCourse(courseCreateDTO);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get course by ID
     * GET /api/courses/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<?> getCourseById(@PathVariable Long id) {
        try {
            Optional<CourseDTO> course = courseService.findById(id);
            return course.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching course: " + e.getMessage()));
        }
    }

    /**
     * Get course by course code
     * GET /api/courses/code/{courseCode}
     */
    @GetMapping("/code/{courseCode}")
    public ResponseEntity<?> getCourseByCourseCode(@PathVariable String courseCode) {
        try {
            Optional<CourseDTO> course = courseService.findByCourseCode(courseCode);
            return course.map(ResponseEntity::ok)
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND)
                            .body(null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching course: " + e.getMessage()));
        }
    }

    /**
     * Get all courses
     * GET /api/courses
     */
    @GetMapping
    public ResponseEntity<?> getAllCourses() {
        try {
            List<CourseDTO> courses = courseService.getAllCourses();
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching courses: " + e.getMessage()));
        }
    }

    /**
     * Get courses by faculty
     * GET /api/courses/faculty/{faculty}
     */
    @GetMapping("/faculty/{faculty}")
    public ResponseEntity<?> getCoursesByFaculty(@PathVariable String faculty) {
        try {
            List<CourseDTO> courses = courseService.getCoursesByFaculty(faculty);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching courses: " + e.getMessage()));
        }
    }

    /**
     * Get courses by department
     * GET /api/courses/department/{department}
     */
    @GetMapping("/department/{department}")
    public ResponseEntity<?> getCoursesByDepartment(@PathVariable String department) {
        try {
            List<CourseDTO> courses = courseService.getCoursesByDepartment(department);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching courses: " + e.getMessage()));
        }
    }

    /**
     * Get courses by year and semester
     * GET /api/courses/year/{year}/semester/{semester}
     */
    /**
     * Get courses by year and semester
     * GET /api/courses/year/{year}/semester/{semester}
     */
    @GetMapping("/year/{year}/semester/{semester}")
    public ResponseEntity<?> getCoursesByYearAndSemester(
            @PathVariable String year,  // Changé de Integer à String
            @PathVariable Integer semester) {
        try {
            List<CourseDTO> courses = courseService.getCoursesByYearAndSemester(year, semester);
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching courses: " + e.getMessage()));
        }
    }

    /**
     * Get all active courses
     * GET /api/courses/active
     */
    @GetMapping("/active")
    public ResponseEntity<?> getActiveCourses() {
        try {
            List<CourseDTO> courses = courseService.getActiveCourses();
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching active courses: " + e.getMessage()));
        }
    }

    /**
     * Get all available courses (active and with available seats)
     * GET /api/courses/available
     */
    @GetMapping("/available")
    public ResponseEntity<?> getAvailableCourses() {
        try {
            List<CourseDTO> courses = courseService.getAvailableCourses();
            return ResponseEntity.ok(courses);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error fetching available courses: " + e.getMessage()));
        }
    }

    /**
     * Update a course
     * PUT /api/courses/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<?> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseUpdateDTO courseUpdateDTO) {
        try {
            CourseDTO updated = courseService.updateCourse(id, courseUpdateDTO);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a course
     * DELETE /api/courses/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCourse(@PathVariable Long id) {
        try {
            courseService.deleteCourse(id);
            return ResponseEntity.ok(Map.of("message", "Course deleted successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Add a prerequisite to a course
     * POST /api/courses/{courseId}/prerequisites/{prerequisiteId}
     */
    @PostMapping("/{courseId}/prerequisites/{prerequisiteId}")
    public ResponseEntity<?> addPrerequisite(
            @PathVariable Long courseId,
            @PathVariable Long prerequisiteId) {
        try {
            courseService.addPrerequisite(courseId, prerequisiteId);
            return ResponseEntity.ok(Map.of("message", "Prerequisite added successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Remove a prerequisite from a course
     * DELETE /api/courses/{courseId}/prerequisites/{prerequisiteId}
     */
    @DeleteMapping("/{courseId}/prerequisites/{prerequisiteId}")
    public ResponseEntity<?> removePrerequisite(
            @PathVariable Long courseId,
            @PathVariable Long prerequisiteId) {
        try {
            courseService.removePrerequisite(courseId, prerequisiteId);
            return ResponseEntity.ok(Map.of("message", "Prerequisite removed successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Check if a student meets prerequisites for a course
     * GET /api/courses/{courseId}/check-prerequisites/{studentId}
     */
    @GetMapping("/{courseId}/check-prerequisites/{studentId}")
    public ResponseEntity<?> checkPrerequisites(
            @PathVariable Long courseId,
            @PathVariable Long studentId) {
        try {
            boolean canEnroll = courseService.checkPrerequisites(studentId, courseId);

            if (canEnroll) {
                return ResponseEntity.ok(Map.of(
                        "canEnroll", true,
                        "message", "Prerequisites met"
                ));
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                                "canEnroll", false,
                                "message", "Prerequisites not met"
                        ));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error checking prerequisites: " + e.getMessage()));
        }
    }
}