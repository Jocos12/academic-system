package com.unt.academic_system.service;

import com.unt.academic_system.dto.CourseCreateDTO;
import com.unt.academic_system.dto.CourseDTO;
import com.unt.academic_system.dto.CourseUpdateDTO;

import java.util.List;
import java.util.Optional;

public interface CourseService {

    CourseDTO createCourse(CourseCreateDTO courseCreateDTO);

    Optional<CourseDTO> findById(Long id);

    Optional<CourseDTO> findByCourseCode(String courseCode);

    CourseDTO updateCourse(Long id, CourseUpdateDTO courseUpdateDTO);

    void deleteCourse(Long id);

    List<CourseDTO> getAllCourses();

    List<CourseDTO> getCoursesByFaculty(String faculty);

    List<CourseDTO> getCoursesByDepartment(String department);

    List<CourseDTO> getCoursesByYearAndSemester(String year, Integer semester);

    List<CourseDTO> getActiveCourses();

    List<CourseDTO> getAvailableCourses();

    void addPrerequisite(Long courseId, Long prerequisiteId);

    void removePrerequisite(Long courseId, Long prerequisiteId);

    boolean checkPrerequisites(Long studentId, Long courseId);
}