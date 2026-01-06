package com.unt.academic_system.service;

import com.unt.academic_system.dto.EnrollmentCreateDTO;
import com.unt.academic_system.dto.EnrollmentDTO;
import com.unt.academic_system.dto.EnrollmentUpdateDTO;
import com.unt.academic_system.model.Course;
import com.unt.academic_system.model.Enrollment;
import com.unt.academic_system.model.EnrollmentStatus;
import com.unt.academic_system.model.Student;
import com.unt.academic_system.repository.CourseRepository;
import com.unt.academic_system.repository.EnrollmentRepository;
import com.unt.academic_system.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final CourseService courseService;

    @Override
    public EnrollmentDTO enrollStudent(EnrollmentCreateDTO enrollmentCreateDTO) {
        // Validate student exists
        Student student = studentRepository.findById(enrollmentCreateDTO.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Validate course exists
        Course course = courseRepository.findById(enrollmentCreateDTO.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check if already enrolled
        if (enrollmentRepository.existsByStudentIdAndCourseIdAndAcademicYearAndSemester(
                enrollmentCreateDTO.getStudentId(),
                enrollmentCreateDTO.getCourseId(),
                enrollmentCreateDTO.getAcademicYear(),
                enrollmentCreateDTO.getSemester())) {
            throw new RuntimeException("Student is already enrolled in this course for the specified period");
        }

        // Check prerequisites
        if (!courseService.checkPrerequisites(enrollmentCreateDTO.getStudentId(), enrollmentCreateDTO.getCourseId())) {
            throw new RuntimeException("Prerequisites not met for this course");
        }

        // Check course capacity
        Integer currentEnrollments = enrollmentRepository.countActiveByCourseId(enrollmentCreateDTO.getCourseId());
        if (course.getMaxStudents() != null && currentEnrollments >= course.getMaxStudents()) {
            throw new RuntimeException("Course is full - maximum capacity reached");
        }

        // Check if course is active
        if (!course.getIsActive()) {
            throw new RuntimeException("Course is not currently active");
        }

        // Create enrollment
        Enrollment enrollment = new Enrollment();
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setAcademicYear(enrollmentCreateDTO.getAcademicYear());
        enrollment.setSemester(enrollmentCreateDTO.getSemester());
        enrollment.setStatus(EnrollmentStatus.PENDING);
        enrollment.setIsPaid(false);
        enrollment.setAttendance(0);

        Enrollment savedEnrollment = enrollmentRepository.save(enrollment);
        return EnrollmentDTO.fromEntity(savedEnrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentDTO> findAll() {
        return enrollmentRepository.findAll().stream()
                .map(EnrollmentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<EnrollmentDTO> findById(Long id) {
        return enrollmentRepository.findById(id)
                .map(EnrollmentDTO::fromEntity);
    }

    @Override
    public EnrollmentDTO updateEnrollment(Long id, EnrollmentUpdateDTO enrollmentUpdateDTO) {
        Enrollment existingEnrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        // Update status
        if (enrollmentUpdateDTO.getStatus() != null) {
            existingEnrollment.setStatus(enrollmentUpdateDTO.getStatus());
        }

        // Update grades
        if (enrollmentUpdateDTO.getMidtermGrade() != null) {
            existingEnrollment.setMidtermGrade(enrollmentUpdateDTO.getMidtermGrade());
        }

        if (enrollmentUpdateDTO.getFinalGrade() != null) {
            existingEnrollment.setFinalGrade(enrollmentUpdateDTO.getFinalGrade());
        }

        // Calculate total grade if both grades are present
        if (existingEnrollment.getMidtermGrade() != null && existingEnrollment.getFinalGrade() != null) {
            calculateAndSetGrades(existingEnrollment);
        }

        // Update attendance
        if (enrollmentUpdateDTO.getAttendance() != null) {
            existingEnrollment.setAttendance(enrollmentUpdateDTO.getAttendance());
        }

        // Update payment status
        if (enrollmentUpdateDTO.getIsPaid() != null) {
            existingEnrollment.setIsPaid(enrollmentUpdateDTO.getIsPaid());
            // If marked as paid, change status from PENDING to REGISTERED
            if (enrollmentUpdateDTO.getIsPaid() && existingEnrollment.getStatus() == EnrollmentStatus.PENDING) {
                existingEnrollment.setStatus(EnrollmentStatus.REGISTERED);
            }
        }

        Enrollment updatedEnrollment = enrollmentRepository.save(existingEnrollment);
        return EnrollmentDTO.fromEntity(updatedEnrollment);
    }

    @Override
    public void dropCourse(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        // Only allow dropping if status is PENDING or REGISTERED
        if (enrollment.getStatus() == EnrollmentStatus.COMPLETED ||
                enrollment.getStatus() == EnrollmentStatus.FAILED) {
            throw new RuntimeException("Cannot drop a completed or failed course");
        }

        enrollment.setStatus(EnrollmentStatus.DROPPED);
        enrollmentRepository.save(enrollment);
    }

    @Override
    public void deleteEnrollment(Long id) {
        Enrollment enrollment = enrollmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        enrollmentRepository.delete(enrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentDTO> getStudentEnrollments(Long studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream()
                .map(EnrollmentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentDTO> getCourseEnrollments(Long courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(EnrollmentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentDTO> getEnrollmentsByStatus(EnrollmentStatus status) {
        return enrollmentRepository.findByStatus(status).stream()
                .map(EnrollmentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public EnrollmentDTO updateGrade(Long enrollmentId, Double midterm, Double finalGrade) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        enrollment.setMidtermGrade(midterm);
        enrollment.setFinalGrade(finalGrade);

        // Calculate total grade and letter grade
        if (midterm != null && finalGrade != null) {
            calculateAndSetGrades(enrollment);
        }

        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return EnrollmentDTO.fromEntity(updatedEnrollment);
    }

    @Override
    public EnrollmentDTO updateAttendance(Long enrollmentId, Integer attendance) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        if (attendance < 0 || attendance > 100) {
            throw new RuntimeException("Attendance must be between 0 and 100");
        }

        enrollment.setAttendance(attendance);
        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return EnrollmentDTO.fromEntity(updatedEnrollment);
    }

    @Override
    public EnrollmentDTO markAsPaid(Long enrollmentId) {
        Enrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Enrollment not found"));

        enrollment.setIsPaid(true);

        // Change status from PENDING to REGISTERED
        if (enrollment.getStatus() == EnrollmentStatus.PENDING) {
            enrollment.setStatus(EnrollmentStatus.REGISTERED);
        }

        Enrollment updatedEnrollment = enrollmentRepository.save(enrollment);
        return EnrollmentDTO.fromEntity(updatedEnrollment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentDTO> getStudentTranscript(Long studentId) {
        return enrollmentRepository.findByStudentIdAndStatus(studentId, EnrollmentStatus.COMPLETED)
                .stream()
                .map(EnrollmentDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Integer calculateCurrentCredits(Long studentId, String academicYear, Integer semester) {
        Integer credits = enrollmentRepository.calculateCurrentSemesterCredits(studentId, academicYear, semester);
        return credits != null ? credits : 0;
    }

    @Override
    @Transactional(readOnly = true)
    public Double calculateGPA(Long studentId) {
        Double gpa = enrollmentRepository.calculateGPA(studentId);
        return gpa != null ? gpa : 0.0;
    }

    /**
     * Helper method to calculate total grade and letter grade
     */
    private void calculateAndSetGrades(Enrollment enrollment) {
        Double midterm = enrollment.getMidtermGrade();
        Double finalGrade = enrollment.getFinalGrade();

        if (midterm == null || finalGrade == null) {
            return;
        }

        // Calculate total grade (40% midterm + 60% final)
        double total = (midterm * 0.4) + (finalGrade * 0.6);
        enrollment.setTotalGrade(total);

        // Calculate letter grade
        String letterGrade = calculateLetterGrade(total);
        enrollment.setLetterGrade(letterGrade);

        // Update status based on grade
        if (total >= 50) {
            enrollment.setStatus(EnrollmentStatus.COMPLETED);
        } else {
            enrollment.setStatus(EnrollmentStatus.FAILED);
        }
    }

    /**
     * Helper method to calculate letter grade
     */
    private String calculateLetterGrade(double grade) {
        if (grade >= 90) return "A";
        if (grade >= 85) return "B+";
        if (grade >= 80) return "B";
        if (grade >= 75) return "C+";
        if (grade >= 70) return "C";
        if (grade >= 60) return "D";
        return "F";
    }
}