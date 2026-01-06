package com.unt.academic_system.repository;

import com.unt.academic_system.model.DayOfWeek;
import com.unt.academic_system.model.Timetable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TimetableRepository extends JpaRepository<Timetable, Long> {

    // ✅ SIMPLIFIED - Find timetable by course (no complex joins)
    @Query("SELECT t FROM Timetable t WHERE t.course.id = :courseId")
    List<Timetable> findByCourseId(@Param("courseId") Long courseId);

    // Find timetable by academic year
    List<Timetable> findByAcademicYearId(Long academicYearId);

    // Find timetable by day
    List<Timetable> findByDayOfWeek(DayOfWeek day);

    // ✅ FIXED - Simplified query without complex joins
    @Query("SELECT DISTINCT t FROM Timetable t " +
            "WHERE t.course.id IN (" +
            "    SELECT e.course.id FROM Enrollment e " +
            "    WHERE e.student.id = :studentId" +
            ") " +
            "ORDER BY t.dayOfWeek, t.startTime")
    List<Timetable> findStudentTimetable(@Param("studentId") Long studentId);

    // ✅ Alternative: Filter by academic year
    @Query("SELECT DISTINCT t FROM Timetable t " +
            "WHERE t.course.id IN (" +
            "    SELECT e.course.id FROM Enrollment e " +
            "    WHERE e.student.id = :studentId" +
            ") " +
            "AND t.academicYear.yearCode = :yearCode " +
            "ORDER BY t.dayOfWeek, t.startTime")
    List<Timetable> findStudentTimetableByYear(
            @Param("studentId") Long studentId,
            @Param("yearCode") String yearCode
    );

    // ✅ Show only active enrollments
    @Query("SELECT DISTINCT t FROM Timetable t " +
            "WHERE t.course.id IN (" +
            "    SELECT e.course.id FROM Enrollment e " +
            "    WHERE e.student.id = :studentId " +
            "    AND (e.status = 'REGISTERED' OR e.status = 'IN_PROGRESS')" +
            ") " +
            "ORDER BY t.dayOfWeek, t.startTime")
    List<Timetable> findStudentActiveTimetable(@Param("studentId") Long studentId);

    // ✅ Current academic year only
    @Query("SELECT DISTINCT t FROM Timetable t " +
            "WHERE t.course.id IN (" +
            "    SELECT e.course.id FROM Enrollment e " +
            "    WHERE e.student.id = :studentId" +
            ") " +
            "AND t.academicYear.isCurrent = true " +
            "ORDER BY t.dayOfWeek, t.startTime")
    List<Timetable> findStudentCurrentTimetable(@Param("studentId") Long studentId);

    // ✅ Lecturer timetable - simplified
    @Query("SELECT DISTINCT t FROM Timetable t " +
            "WHERE t.course.lecturer.id = :lecturerId " +
            "ORDER BY t.dayOfWeek, t.startTime")
    List<Timetable> findLecturerTimetable(@Param("lecturerId") Long lecturerId);

    // ✅ Lecturer current timetable
    @Query("SELECT DISTINCT t FROM Timetable t " +
            "WHERE t.course.lecturer.id = :lecturerId " +
            "AND t.academicYear.isCurrent = true " +
            "ORDER BY t.dayOfWeek, t.startTime")
    List<Timetable> findLecturerCurrentTimetable(@Param("lecturerId") Long lecturerId);
}