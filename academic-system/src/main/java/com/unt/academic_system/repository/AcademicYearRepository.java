package com.unt.academic_system.repository;

import com.unt.academic_system.model.AcademicYear;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AcademicYearRepository extends JpaRepository<AcademicYear, Long> {

    // ✅ Find academic year by code
    Optional<AcademicYear> findByYearCode(String yearCode);

    // ✅ Find academic year by code and active status
    Optional<AcademicYear> findByYearCodeAndIsActiveTrue(String yearCode);

    // ✅ Find current academic year
    Optional<AcademicYear> findByIsCurrentTrue();

    // ✅ Find active academic years
    List<AcademicYear> findByIsActiveTrue();

    // ✅ Find by year code and semester
    Optional<AcademicYear> findByYearCodeAndSemester(String yearCode, Integer semester);

    // ✅ Find by year code, semester and active status
    Optional<AcademicYear> findByYearCodeAndSemesterAndIsActiveTrue(String yearCode, Integer semester);

    // ✅ Find all ordered by start date descending (most recent first)
    List<AcademicYear> findAllByOrderByStartDateDesc();

    // ✅ Find academic years by status
    List<AcademicYear> findByIsActive(Boolean isActive);

    // ✅ Find academic years within a date range
    @Query("SELECT ay FROM AcademicYear ay WHERE ay.startDate <= :endDate AND ay.endDate >= :startDate")
    List<AcademicYear> findAcademicYearsInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // ✅ Find current or upcoming academic years
    @Query("SELECT ay FROM AcademicYear ay WHERE ay.endDate >= CURRENT_DATE ORDER BY ay.startDate ASC")
    List<AcademicYear> findCurrentAndUpcomingAcademicYears();

    // ✅ Find academic years by semester
    List<AcademicYear> findBySemester(Integer semester);

    // ✅ Check if an academic year exists with the same year code and semester
    boolean existsByYearCodeAndSemester(String yearCode, Integer semester);

    // ✅ Find academic years that overlap with registration dates
    @Query("SELECT ay FROM AcademicYear ay WHERE " +
            "ay.registrationStartDate <= :endDate AND ay.registrationEndDate >= :startDate")
    List<AcademicYear> findAcademicYearsWithOverlappingRegistration(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // ✅ Find academic years currently in registration period
    @Query("SELECT ay FROM AcademicYear ay WHERE " +
            "CURRENT_DATE >= ay.registrationStartDate AND CURRENT_DATE <= ay.registrationEndDate " +
            "AND ay.isActive = true")
    List<AcademicYear> findAcademicYearsInRegistrationPeriod();

    // ✅ Find academic years currently in exam period
    @Query("SELECT ay FROM AcademicYear ay WHERE " +
            "CURRENT_DATE >= ay.examStartDate AND CURRENT_DATE <= ay.examEndDate " +
            "AND ay.isActive = true")
    List<AcademicYear> findAcademicYearsInExamPeriod();

    // ✅ Count active academic years
    long countByIsActiveTrue();

    // ✅ Count academic years by year code
    long countByYearCode(String yearCode);

    // ✅ Find the most recent academic year
    @Query("SELECT ay FROM AcademicYear ay ORDER BY ay.startDate DESC LIMIT 1")
    Optional<AcademicYear> findMostRecentAcademicYear();

    // ✅ Find academic years by year code ordered by semester
    List<AcademicYear> findByYearCodeOrderBySemesterAsc(String yearCode);

    // ✅ Custom query to find academic year for a given date
    @Query("SELECT ay FROM AcademicYear ay WHERE :date BETWEEN ay.startDate AND ay.endDate")
    Optional<AcademicYear> findAcademicYearForDate(@Param("date") LocalDate date);

    // ✅ Find all academic years with courses
    @Query("SELECT DISTINCT ay FROM AcademicYear ay " +
            "JOIN Enrollment e ON e.academicYear = ay.yearCode " +
            "WHERE ay.isActive = true")
    List<AcademicYear> findAcademicYearsWithEnrollments();

    // ✅ Delete academic years by year code
    void deleteByYearCode(String yearCode);

    // ✅ Find academic years that need to be archived (ended more than 1 year ago)
    @Query("SELECT ay FROM AcademicYear ay WHERE ay.endDate < :cutoffDate AND ay.isActive = true")
    List<AcademicYear> findAcademicYearsToArchive(@Param("cutoffDate") LocalDate cutoffDate);
}