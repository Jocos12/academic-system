package com.unt.academic_system.dto;

import com.unt.academic_system.model.*;
import lombok.Data;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Data
public class ParentResponseDTO {
    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phoneNumber;
    private String address;
    private String relationship;
    private String occupation;
    private List<StudentBasicDTO> children;

    @Data
    public static class StudentBasicDTO {
        private Long id;
        private String firstName;
        private String lastName;
        private String email;
        private String studentId;
        private String faculty;
        private String program;
        private Integer currentYear;
        private Integer currentSemester;
        private List<EnrollmentBasicDTO> enrollments;
        private List<PaymentBasicDTO> payments;
    }

    @Data
    public static class EnrollmentBasicDTO {
        private Long id;
        private String academicYear;
        private Integer semester;
        private String status;
        private Double midtermGrade;
        private Double finalGrade;
        private Double totalGrade;
        private String letterGrade;
        private CourseBasicDTO course;
    }

    @Data
    public static class CourseBasicDTO {
        private Long id;
        private String courseCode;
        private String courseName;
        private Integer credits;
        private String faculty;
        private String department;
    }

    @Data
    public static class PaymentBasicDTO {
        private Long id;
        private Double amount;
        private String academicYear;
        private Integer semester;
        private String paymentType;
        private String paymentMethod;
        private String paymentStatus;
        private String transactionReference;
        private String paymentDate;
        private String processedBy;
    }

    public static ParentResponseDTO fromEntity(Parent parent) {
        ParentResponseDTO dto = new ParentResponseDTO();
        dto.setId(parent.getId());
        dto.setFirstName(parent.getFirstName());
        dto.setLastName(parent.getLastName());
        dto.setEmail(parent.getEmail());
        dto.setPhoneNumber(parent.getPhoneNumber());
        dto.setAddress(parent.getAddress());
        dto.setRelationship(parent.getRelationship());
        dto.setOccupation(parent.getOccupation());

        if (parent.getChildren() != null) {
            dto.setChildren(parent.getChildren().stream()
                    .map(ParentResponseDTO::mapStudent)
                    .collect(Collectors.toList()));
        } else {
            dto.setChildren(new ArrayList<>());
        }

        return dto;
    }

    private static StudentBasicDTO mapStudent(Student student) {
        StudentBasicDTO dto = new StudentBasicDTO();
        dto.setId(student.getId());
        dto.setFirstName(student.getFirstName());
        dto.setLastName(student.getLastName());
        dto.setEmail(student.getEmail());
        dto.setStudentId(student.getStudentId());
        dto.setFaculty(student.getFaculty());
        dto.setProgram(student.getProgram());
        dto.setCurrentYear(student.getCurrentYear());
        dto.setCurrentSemester(student.getCurrentSemester());

        if (student.getEnrollments() != null) {
            dto.setEnrollments(student.getEnrollments().stream()
                    .map(ParentResponseDTO::mapEnrollment)
                    .collect(Collectors.toList()));
        } else {
            dto.setEnrollments(new ArrayList<>());
        }

        if (student.getPayments() != null) {
            dto.setPayments(student.getPayments().stream()
                    .map(ParentResponseDTO::mapPayment)
                    .collect(Collectors.toList()));
        } else {
            dto.setPayments(new ArrayList<>());
        }

        return dto;
    }

    private static EnrollmentBasicDTO mapEnrollment(Enrollment enrollment) {
        EnrollmentBasicDTO dto = new EnrollmentBasicDTO();
        dto.setId(enrollment.getId());
        dto.setAcademicYear(enrollment.getAcademicYear());
        dto.setSemester(enrollment.getSemester());
        dto.setStatus(enrollment.getStatus().toString());
        dto.setMidtermGrade(enrollment.getMidtermGrade());
        dto.setFinalGrade(enrollment.getFinalGrade());
        dto.setTotalGrade(enrollment.getTotalGrade());
        dto.setLetterGrade(enrollment.getLetterGrade());

        if (enrollment.getCourse() != null) {
            dto.setCourse(mapCourse(enrollment.getCourse()));
        }

        return dto;
    }

    private static CourseBasicDTO mapCourse(Course course) {
        CourseBasicDTO dto = new CourseBasicDTO();
        dto.setId(course.getId());
        dto.setCourseCode(course.getCourseCode());
        dto.setCourseName(course.getCourseName());
        dto.setCredits(course.getCredits());
        dto.setFaculty(course.getFaculty());
        dto.setDepartment(course.getDepartment());
        return dto;
    }

    private static PaymentBasicDTO mapPayment(Payment payment) {
        PaymentBasicDTO dto = new PaymentBasicDTO();
        dto.setId(payment.getId());
        dto.setAmount(payment.getAmount());
        dto.setAcademicYear(payment.getAcademicYear());
        dto.setSemester(payment.getSemester());

        // Correction: utiliser les noms corrects des méthodes
        dto.setPaymentType(payment.getPaymentType() != null ? payment.getPaymentType().toString() : null);
        dto.setPaymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod().toString() : null);
        dto.setPaymentStatus(payment.getPaymentStatus() != null ? payment.getPaymentStatus().toString() : null);

        dto.setTransactionReference(payment.getTransactionReference());
        dto.setPaymentDate(payment.getPaymentDate() != null ? payment.getPaymentDate().toString() : null);
        dto.setProcessedBy(payment.getProcessedBy());

        return dto;
    }
}