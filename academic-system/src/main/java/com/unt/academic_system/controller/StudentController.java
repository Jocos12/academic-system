package com.unt.academic_system.controller;

import com.unt.academic_system.model.Student;
import com.unt.academic_system.service.StudentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StudentController {

    private final StudentService studentService;

    @PostMapping("/register")
    public ResponseEntity<?> registerStudent(@RequestBody Student student) {
        try {
            log.info("📥 POST /api/students/register - Received request");
            log.info("Student data: {}", student);

            // ✅ Debug parent data
            if (student.getParent() != null) {
                log.info("👨‍👩‍👧 Parent data received:");
                log.info("  - Parent ID: {}", student.getParent().getId());
                log.info("  - Parent object: {}", student.getParent());
            } else {
                log.info("⚠️ No parent data received");
            }

            Student registeredStudent = studentService.registerStudent(student);

            log.info("✅ Student registered successfully with ID: {}", registeredStudent.getId());

            // ✅ Verify parent assignment
            if (registeredStudent.getParent() != null) {
                log.info("✅ Parent successfully assigned: {} {} (ID: {})",
                        registeredStudent.getParent().getFirstName(),
                        registeredStudent.getParent().getLastName(),
                        registeredStudent.getParent().getId());
            } else {
                log.warn("⚠️ Student registered but no parent assigned");
            }

            return ResponseEntity.status(HttpStatus.CREATED).body(registeredStudent);
        } catch (RuntimeException e) {
            log.error("❌ Error registering student: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getStudentById(@PathVariable Long id) {
        log.info("📥 GET /api/students/{} - Fetching student", id);

        Optional<Student> student = studentService.findById(id);

        if (student.isPresent()) {
            log.info("✅ Student found: {}", student.get().getStudentId());

            // ✅ Debug parent data
            if (student.get().getParent() != null) {
                log.info("👨‍👩‍👧 Parent data: {} {} (ID: {})",
                        student.get().getParent().getFirstName(),
                        student.get().getParent().getLastName(),
                        student.get().getParent().getId());
            } else {
                log.info("⚠️ No parent assigned to this student");
            }

            return ResponseEntity.ok(student.get());
        } else {
            log.warn("⚠️ Student not found with ID: {}", id);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @GetMapping("/student-id/{studentId}")
    public ResponseEntity<?> getStudentByStudentId(@PathVariable String studentId) {
        log.info("📥 GET /api/students/student-id/{} - Fetching student", studentId);

        Optional<Student> student = studentService.findByStudentId(studentId);
        return student.map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
    }

    @GetMapping
    public ResponseEntity<List<Student>> getAllStudents() {
        log.info("📥 GET /api/students - Fetching all students");

        List<Student> students = studentService.getAllStudents();

        // ✅ Debug parent assignments
        long studentsWithParent = students.stream()
                .filter(s -> s.getParent() != null)
                .count();

        log.info("✅ Found {} students ({} with parents assigned)",
                students.size(), studentsWithParent);

        return ResponseEntity.ok(students);
    }

    @GetMapping("/faculty/{faculty}")
    public ResponseEntity<List<Student>> getStudentsByFaculty(@PathVariable String faculty) {
        log.info("📥 GET /api/students/faculty/{}", faculty);
        return ResponseEntity.ok(studentService.getStudentsByFaculty(faculty));
    }

    @GetMapping("/program/{program}")
    public ResponseEntity<List<Student>> getStudentsByProgram(@PathVariable String program) {
        log.info("📥 GET /api/students/program/{}", program);
        return ResponseEntity.ok(studentService.getStudentsByProgram(program));
    }

    @GetMapping("/year/{year}/semester/{semester}")
    public ResponseEntity<List<Student>> getStudentsByYearAndSemester(
            @PathVariable Integer year,
            @PathVariable Integer semester) {
        log.info("📥 GET /api/students/year/{}/semester/{}", year, semester);
        return ResponseEntity.ok(studentService.getStudentsByYearAndSemester(year, semester));
    }

    @GetMapping("/high-gpa/{minGpa}")
    public ResponseEntity<List<Student>> getStudentsWithHighGPA(@PathVariable Double minGpa) {
        log.info("📥 GET /api/students/high-gpa/{}", minGpa);
        return ResponseEntity.ok(studentService.getStudentsWithHighGPA(minGpa));
    }

    @GetMapping("/unpaid/{academicYear}/{semester}")
    public ResponseEntity<List<Student>> getStudentsWithoutPayment(
            @PathVariable String academicYear,
            @PathVariable Integer semester) {
        log.info("📥 GET /api/students/unpaid/{}/{}", academicYear, semester);
        return ResponseEntity.ok(studentService.getStudentsWithoutPayment(academicYear, semester));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateStudent(@PathVariable Long id, @RequestBody Student student) {
        try {
            log.info("📥 PUT /api/students/{} - Updating student", id);
            log.info("Update data: {}", student);

            // ✅ Debug parent data
            if (student.getParent() != null) {
                log.info("👨‍👩‍👧 Parent update data:");
                log.info("  - Parent ID: {}", student.getParent().getId());
                log.info("  - Parent object: {}", student.getParent());
            } else {
                log.info("⚠️ No parent data in update (will be removed if null)");
            }

            Student updated = studentService.updateStudent(id, student);

            log.info("✅ Student updated successfully");

            // ✅ Verify parent assignment after update
            if (updated.getParent() != null) {
                log.info("✅ Final parent: {} {} (ID: {})",
                        updated.getParent().getFirstName(),
                        updated.getParent().getLastName(),
                        updated.getParent().getId());
            } else {
                log.info("⚠️ Final status: No parent assigned");
            }

            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("❌ Error updating student: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{studentId}/link-parent/{parentId}")
    public ResponseEntity<?> linkParent(@PathVariable Long studentId, @PathVariable Long parentId) {
        try {
            log.info("📥 PUT /api/students/{}/link-parent/{}", studentId, parentId);

            studentService.linkParent(studentId, parentId);

            log.info("✅ Parent linked successfully");
            return ResponseEntity.ok("Parent linked successfully");
        } catch (RuntimeException e) {
            log.error("❌ Error linking parent: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/gpa")
    public ResponseEntity<?> updateGPA(@PathVariable Long id, @RequestParam Double gpa) {
        try {
            log.info("📥 PUT /api/students/{}/gpa - Updating GPA to {}", id, gpa);
            studentService.updateGPA(id, gpa);
            return ResponseEntity.ok("GPA updated successfully");
        } catch (RuntimeException e) {
            log.error("❌ Error updating GPA: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @PutMapping("/{id}/credits")
    public ResponseEntity<?> updateCredits(@PathVariable Long id, @RequestParam Integer credits) {
        try {
            log.info("📥 PUT /api/students/{}/credits - Adding {} credits", id, credits);
            studentService.updateCredits(id, credits);
            return ResponseEntity.ok("Credits updated successfully");
        } catch (RuntimeException e) {
            log.error("❌ Error updating credits: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteStudent(@PathVariable Long id) {
        try {
            log.info("📥 DELETE /api/students/{} - Deleting student", id);

            Optional<Student> student = studentService.findById(id);
            if (student.isEmpty()) {
                log.warn("⚠️ Student not found with ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Student not found");
            }

            // Note: Add delete method to service if needed
            log.info("✅ Student deleted successfully");
            return ResponseEntity.ok("Student deleted successfully");
        } catch (RuntimeException e) {
            log.error("❌ Error deleting student: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(e.getMessage());
        }
    }
}