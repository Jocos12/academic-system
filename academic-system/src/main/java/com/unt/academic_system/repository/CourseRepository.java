package com.unt.academic_system.repository;

import com.unt.academic_system.model.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    // ========================================
    // BASIC FINDERS
    // ========================================

    /**
     * Find course by unique course code
     */
    Optional<Course> findByCourseCode(String courseCode);


    /**
     * CRITICAL: Update lecturer_id directly with native query
     * Use this if JPA relationships are not persisting correctly
     */
    @Modifying
    @Query(value = "UPDATE courses SET lecturer_id = :lecturerId WHERE id = :courseId", nativeQuery = true)
    int assignLecturerToCourse(@Param("courseId") Long courseId, @Param("lecturerId") Long lecturerId);

    @Modifying
    @Query(value = "UPDATE courses SET lecturer_id = NULL WHERE id = :courseId", nativeQuery = true)
    int unassignLecturerFromCourse(@Param("courseId") Long courseId);

    /**
     * Check if course code already exists
     */
    boolean existsByCourseCode(String courseCode);

    // ========================================
    // FINDERS BY ORGANIZATIONAL STRUCTURE
    // ========================================

    /**
     * Find all courses by faculty
     */
    List<Course> findByFaculty(String faculty);

    /**
     * Find all courses by department
     */
    List<Course> findByDepartment(String department);

    /**
     * Find courses by year and semester
     */
    List<Course> findByYearAndSemester(String year, Integer semester);

    /**
     * Find courses by credits
     */
    List<Course> findByCredits(Integer credits);

    // ========================================
    // LECTURER RELATIONS - CRITICAL
    // ========================================

    /**
     * Find all courses assigned to a specific lecturer
     * CRITICAL: Used for course assignment operations
     */
    List<Course> findByLecturerId(Long lecturerId);

    /**
     * Find courses by lecturer with JOIN FETCH to avoid N+1 problem
     * Use this for better performance when you need lecturer details
     */
    @Query("SELECT c FROM Course c LEFT JOIN FETCH c.lecturer WHERE c.lecturer.id = :lecturerId")
    List<Course> findByLecturerIdWithLecturer(@Param("lecturerId") Long lecturerId);

    // ========================================
    // STATUS & AVAILABILITY
    // ========================================

    /**
     * Find all active courses
     */
    List<Course> findByIsActiveTrue();

    /**
     * Find available courses (active with available capacity)
     * Checks enrollment count vs max students
     */
    @Query("SELECT c FROM Course c WHERE c.isActive = true AND " +
            "(SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = c.id " +
            "AND e.status = 'REGISTERED') < c.maxStudents")
    List<Course> findAvailableCourses();

    /**
     * Alternative: Find available courses using SIZE function
     * More efficient for small datasets
     */
    @Query("SELECT c FROM Course c WHERE c.isActive = true AND SIZE(c.enrollments) < c.maxStudents")
    List<Course> findAvailableCoursesAlternative();

    // ========================================
    // COMPLEX QUERIES
    // ========================================

    /**
     * Find courses by year, semester, and faculty
     * Useful for student course registration
     */
    @Query("SELECT c FROM Course c WHERE c.year = :year AND c.semester = :semester " +
            "AND c.faculty = :faculty AND c.isActive = true")
    List<Course> findCoursesByYearSemesterAndFaculty(
            @Param("year") Integer year,
            @Param("semester") Integer semester,
            @Param("faculty") String faculty
    );

    /**
     * Find courses with available slots for a specific year and semester
     */
    @Query("SELECT c FROM Course c WHERE c.year = :year AND c.semester = :semester " +
            "AND c.isActive = true AND " +
            "(SELECT COUNT(e) FROM Enrollment e WHERE e.course.id = c.id " +
            "AND e.status = 'REGISTERED') < c.maxStudents")
    List<Course> findAvailableCoursesByYearAndSemester(
            @Param("year") Integer year,
            @Param("semester") Integer semester
    );

    /**
     * Find courses by faculty and year
     */
    @Query("SELECT c FROM Course c WHERE c.faculty = :faculty AND c.year = :year AND c.isActive = true")
    List<Course> findByFacultyAndYear(
            @Param("faculty") String faculty,
            @Param("year") Integer year
    );

    /**
     * Find courses by department with enrollment count
     */
    @Query("SELECT c, COUNT(e) FROM Course c LEFT JOIN c.enrollments e " +
            "WHERE c.department = :department GROUP BY c")
    List<Object[]> findByDepartmentWithEnrollmentCount(@Param("department") String department);

    /**
     * Search courses by name or code (case-insensitive)
     */
    @Query("SELECT c FROM Course c WHERE LOWER(c.courseName) LIKE LOWER(CONCAT('%', :search, '%')) " +
            "OR LOWER(c.courseCode) LIKE LOWER(CONCAT('%', :search, '%'))")
    List<Course> searchCourses(@Param("search") String search);
}