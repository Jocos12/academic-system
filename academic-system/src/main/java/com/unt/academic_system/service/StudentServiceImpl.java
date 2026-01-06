package com.unt.academic_system.service;

import com.unt.academic_system.model.Parent;
import com.unt.academic_system.model.Student;
import com.unt.academic_system.model.UserRole;
import com.unt.academic_system.repository.ParentRepository;
import com.unt.academic_system.repository.StudentRepository;
import com.unt.academic_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StudentServiceImpl implements StudentService {

    private final StudentRepository studentRepository;
    private final ParentRepository parentRepository;
    private final UserRepository userRepository;

    @Override
    public Student registerStudent(Student student) {
        log.info("🎓 Registering new student: {}", student.getStudentId());

        // Validate student ID doesn't exist
        if (studentRepository.existsByStudentId(student.getStudentId())) {
            log.error("❌ Student ID already exists: {}", student.getStudentId());
            throw new RuntimeException("Student ID already exists");
        }

        // Validate email doesn't exist
        if (userRepository.existsByEmail(student.getEmail())) {
            log.error("❌ Email already exists: {}", student.getEmail());
            throw new RuntimeException("Email already exists");
        }

        // Set default values
        student.setIsActive(true);
        student.setRole(UserRole.STUDENT);

        if (student.getCumulativeGPA() == null) {
            student.setCumulativeGPA(0.0);
        }
        if (student.getTotalCreditsEarned() == null) {
            student.setTotalCreditsEarned(0);
        }

        // ✅ FIX 1: Handle parent assignment during registration
        if (student.getParent() != null && student.getParent().getId() != null) {
            Long parentId = student.getParent().getId();
            log.info("🔗 Attempting to link parent ID: {}", parentId);

            Optional<Parent> parentOpt = parentRepository.findById(parentId);
            if (parentOpt.isPresent()) {
                student.setParent(parentOpt.get());
                log.info("✅ Parent linked successfully: {} {}",
                        parentOpt.get().getFirstName(),
                        parentOpt.get().getLastName());
            } else {
                log.warn("⚠️ Parent ID {} not found, student will be created without parent", parentId);
                student.setParent(null);
            }
        } else {
            log.info("ℹ️ No parent to link");
            student.setParent(null);
        }

        Student saved = studentRepository.save(student);
        log.info("✅ Student registered successfully with ID: {}", saved.getId());

        // Log parent assignment status
        if (saved.getParent() != null) {
            log.info("👨‍👩‍👧 Parent assigned: {} {} (ID: {})",
                    saved.getParent().getFirstName(),
                    saved.getParent().getLastName(),
                    saved.getParent().getId());
        } else {
            log.info("⚠️ No parent assigned to student");
        }

        return saved;
    }

    @Override
    public Optional<Student> findById(Long id) {
        log.debug("🔍 Finding student by ID: {}", id);
        return studentRepository.findById(id);
    }

    @Override
    public Optional<Student> findByStudentId(String studentId) {
        log.debug("🔍 Finding student by student ID: {}", studentId);
        return studentRepository.findByStudentId(studentId);
    }

    @Override
    public Student updateStudent(Long id, Student updatedStudent) {
        log.info("📝 Updating student ID: {}", id);

        Student existing = studentRepository.findById(id)
                .orElseThrow(() -> {
                    log.error("❌ Student not found with ID: {}", id);
                    return new RuntimeException("Student not found");
                });

        // Update basic fields
        existing.setFirstName(updatedStudent.getFirstName());
        existing.setLastName(updatedStudent.getLastName());
        existing.setEmail(updatedStudent.getEmail());
        existing.setPhoneNumber(updatedStudent.getPhoneNumber());
        existing.setAddress(updatedStudent.getAddress());

        // Update student-specific fields
        existing.setDateOfBirth(updatedStudent.getDateOfBirth());
        existing.setFaculty(updatedStudent.getFaculty());
        existing.setProgram(updatedStudent.getProgram());
        existing.setCurrentYear(updatedStudent.getCurrentYear());
        existing.setCurrentSemester(updatedStudent.getCurrentSemester());
        existing.setAcademicYear(updatedStudent.getAcademicYear());

        // Update GPA and credits if provided
        if (updatedStudent.getCumulativeGPA() != null) {
            existing.setCumulativeGPA(updatedStudent.getCumulativeGPA());
        }
        if (updatedStudent.getTotalCreditsEarned() != null) {
            existing.setTotalCreditsEarned(updatedStudent.getTotalCreditsEarned());
        }

        // ✅ FIX 2: Handle parent assignment during update
        if (updatedStudent.getParent() != null && updatedStudent.getParent().getId() != null) {
            Long parentId = updatedStudent.getParent().getId();
            log.info("🔗 Updating parent link to ID: {}", parentId);

            Optional<Parent> parentOpt = parentRepository.findById(parentId);
            if (parentOpt.isPresent()) {
                existing.setParent(parentOpt.get());
                log.info("✅ Parent updated successfully: {} {}",
                        parentOpt.get().getFirstName(),
                        parentOpt.get().getLastName());
            } else {
                log.warn("⚠️ Parent ID {} not found, keeping existing parent", parentId);
            }
        } else if (updatedStudent.getParent() == null) {
            // If parent is explicitly set to null, remove the link
            log.info("🔓 Removing parent link");
            existing.setParent(null);
        }

        // Ensure isActive is preserved or updated correctly
        if (updatedStudent.getIsActive() != null) {
            existing.setIsActive(updatedStudent.getIsActive());
        }

        Student saved = studentRepository.save(existing);
        log.info("✅ Student updated successfully");

        // Log parent assignment status
        if (saved.getParent() != null) {
            log.info("👨‍👩‍👧 Final parent: {} {} (ID: {})",
                    saved.getParent().getFirstName(),
                    saved.getParent().getLastName(),
                    saved.getParent().getId());
        } else {
            log.info("⚠️ Final status: No parent assigned");
        }

        return saved;
    }

    @Override
    public List<Student> getAllStudents() {
        log.debug("📋 Getting all students");
        List<Student> students = studentRepository.findAll();
        log.info("✅ Found {} students", students.size());
        return students;
    }

    @Override
    public List<Student> getStudentsByFaculty(String faculty) {
        log.debug("🏫 Getting students by faculty: {}", faculty);
        return studentRepository.findByFaculty(faculty);
    }

    @Override
    public List<Student> getStudentsByProgram(String program) {
        log.debug("📚 Getting students by program: {}", program);
        return studentRepository.findByProgram(program);
    }

    @Override
    public List<Student> getStudentsByYearAndSemester(Integer year, Integer semester) {
        log.debug("📅 Getting students by year {} and semester {}", year, semester);
        return studentRepository.findByCurrentYearAndCurrentSemester(year, semester);
    }

    @Override
    public List<Student> getStudentsWithHighGPA(Double minGpa) {
        log.debug("🌟 Getting students with GPA >= {}", minGpa);
        return studentRepository.findByCumulativeGPAGreaterThanEqual(minGpa);
    }

    @Override
    public void linkParent(Long studentId, Long parentId) {
        log.info("🔗 Linking student {} to parent {}", studentId, parentId);

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> {
                    log.error("❌ Student not found with ID: {}", studentId);
                    return new RuntimeException("Student not found");
                });

        Parent parent = parentRepository.findById(parentId)
                .orElseThrow(() -> {
                    log.error("❌ Parent not found with ID: {}", parentId);
                    return new RuntimeException("Parent not found");
                });

        student.setParent(parent);
        studentRepository.save(student);

        log.info("✅ Successfully linked student {} to parent {} {}",
                student.getStudentId(),
                parent.getFirstName(),
                parent.getLastName());
    }

    @Override
    public void updateGPA(Long studentId, Double newGpa) {
        log.info("📊 Updating GPA for student {}: {}", studentId, newGpa);

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (newGpa < 0.0 || newGpa > 4.0) {
            log.error("❌ Invalid GPA value: {}", newGpa);
            throw new RuntimeException("GPA must be between 0.0 and 4.0");
        }

        student.setCumulativeGPA(newGpa);
        studentRepository.save(student);
        log.info("✅ GPA updated successfully");
    }

    @Override
    public void updateCredits(Long studentId, Integer creditsToAdd) {
        log.info("🎓 Adding {} credits to student {}", creditsToAdd, studentId);

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        Integer currentCredits = student.getTotalCreditsEarned();
        student.setTotalCreditsEarned(currentCredits + creditsToAdd);
        studentRepository.save(student);

        log.info("✅ Credits updated: {} -> {}", currentCredits, currentCredits + creditsToAdd);
    }

    @Override
    public List<Student> getStudentsWithoutPayment(String academicYear, Integer semester) {
        log.debug("💰 Getting students without payment for {} semester {}", academicYear, semester);
        return studentRepository.findStudentsWithoutPayment(academicYear, semester);
    }
}