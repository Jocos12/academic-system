package com.unt.academic_system.service;

import com.unt.academic_system.dto.CourseCreateDTO;
import com.unt.academic_system.dto.CourseDTO;
import com.unt.academic_system.dto.CourseUpdateDTO;
import com.unt.academic_system.model.Course;
import com.unt.academic_system.model.EnrollmentStatus;
import com.unt.academic_system.model.Lecturer;
import com.unt.academic_system.repository.CourseRepository;
import com.unt.academic_system.repository.EnrollmentRepository;
import com.unt.academic_system.repository.LecturerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final LecturerRepository lecturerRepository;

    @Override
    public CourseDTO createCourse(CourseCreateDTO courseCreateDTO) {
        // Check if course code already exists
        if (courseRepository.existsByCourseCode(courseCreateDTO.getCourseCode())) {
            throw new RuntimeException("Course code already exists");
        }

        // Create new Course entity
        Course course = new Course();
        course.setCourseCode(courseCreateDTO.getCourseCode());
        course.setCourseName(courseCreateDTO.getCourseName());
        course.setDescription(courseCreateDTO.getDescription());
        course.setCredits(courseCreateDTO.getCredits());
        course.setFaculty(courseCreateDTO.getFaculty());
        course.setDepartment(courseCreateDTO.getDepartment());
        course.setYear(courseCreateDTO.getYear());
        course.setSemester(courseCreateDTO.getSemester());
        course.setPrice(courseCreateDTO.getPrice());
        course.setMaxStudents(courseCreateDTO.getMaxStudents());
        course.setIsActive(courseCreateDTO.getIsActive() != null ? courseCreateDTO.getIsActive() : true);

        // Set lecturer if provided
        if (courseCreateDTO.getLecturerId() != null) {
            Lecturer lecturer = lecturerRepository.findById(courseCreateDTO.getLecturerId())
                    .orElseThrow(() -> new RuntimeException("Lecturer not found"));
            course.setLecturer(lecturer);
        }

        // Save course first
        Course savedCourse = courseRepository.save(course);

        // Add prerequisites if provided
        if (courseCreateDTO.getPrerequisiteIds() != null && !courseCreateDTO.getPrerequisiteIds().isEmpty()) {
            for (Long prereqId : courseCreateDTO.getPrerequisiteIds()) {
                Course prerequisite = courseRepository.findById(prereqId)
                        .orElseThrow(() -> new RuntimeException("Prerequisite course not found: " + prereqId));
                savedCourse.getPrerequisites().add(prerequisite);
            }
            savedCourse = courseRepository.save(savedCourse);
        }

        // Get enrollment count
        Integer enrollmentCount = enrollmentRepository.countByCourseId(savedCourse.getId());

        return CourseDTO.fromEntity(savedCourse, enrollmentCount);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CourseDTO> findById(Long id) {
        return courseRepository.findById(id)
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<CourseDTO> findByCourseCode(String courseCode) {
        return courseRepository.findByCourseCode(courseCode)
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                });
    }

    @Override
    public CourseDTO updateCourse(Long id, CourseUpdateDTO courseUpdateDTO) {
        Course existingCourse = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Update fields
        existingCourse.setCourseName(courseUpdateDTO.getCourseName());
        existingCourse.setDescription(courseUpdateDTO.getDescription());
        existingCourse.setCredits(courseUpdateDTO.getCredits());
        existingCourse.setPrice(courseUpdateDTO.getPrice());
        existingCourse.setMaxStudents(courseUpdateDTO.getMaxStudents());

        if (courseUpdateDTO.getIsActive() != null) {
            existingCourse.setIsActive(courseUpdateDTO.getIsActive());
        }

        // Update lecturer if provided
        if (courseUpdateDTO.getLecturerId() != null) {
            Lecturer lecturer = lecturerRepository.findById(courseUpdateDTO.getLecturerId())
                    .orElseThrow(() -> new RuntimeException("Lecturer not found"));
            existingCourse.setLecturer(lecturer);
        }

        Course updatedCourse = courseRepository.save(existingCourse);
        Integer enrollmentCount = enrollmentRepository.countByCourseId(updatedCourse.getId());

        return CourseDTO.fromEntity(updatedCourse, enrollmentCount);
    }

    @Override
    public void deleteCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Clear relationships
        course.getEnrollments().clear();
        course.getContents().clear();
        course.getPrerequisites().clear();
        courseRepository.save(course);

        // Delete course
        courseRepository.delete(course);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDTO> getAllCourses() {
        return courseRepository.findAll().stream()
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDTO> getCoursesByFaculty(String faculty) {
        return courseRepository.findByFaculty(faculty).stream()
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDTO> getCoursesByDepartment(String department) {
        return courseRepository.findByDepartment(department).stream()
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    public List<CourseDTO> getCoursesByYearAndSemester(String year, Integer semester) {
        List<Course> courses = courseRepository.findByYearAndSemester(year, semester);
        return courses.stream()
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDTO> getActiveCourses() {
        return courseRepository.findByIsActiveTrue().stream()
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseDTO> getAvailableCourses() {
        return courseRepository.findAvailableCourses().stream()
                .map(course -> {
                    Integer enrollmentCount = enrollmentRepository.countByCourseId(course.getId());
                    return CourseDTO.fromEntity(course, enrollmentCount);
                })
                .collect(Collectors.toList());
    }

    @Override
    public void addPrerequisite(Long courseId, Long prerequisiteId) {
        if (courseId.equals(prerequisiteId)) {
            throw new RuntimeException("A course cannot be its own prerequisite");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Course prerequisite = courseRepository.findById(prerequisiteId)
                .orElseThrow(() -> new RuntimeException("Prerequisite course not found"));

        // Check for circular dependency
        if (hasCircularDependency(prerequisite, courseId)) {
            throw new RuntimeException("Adding this prerequisite would create a circular dependency");
        }

        course.getPrerequisites().add(prerequisite);
        courseRepository.save(course);
    }

    @Override
    public void removePrerequisite(Long courseId, Long prerequisiteId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Course prerequisite = courseRepository.findById(prerequisiteId)
                .orElseThrow(() -> new RuntimeException("Prerequisite course not found"));

        course.getPrerequisites().remove(prerequisite);
        courseRepository.save(course);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean checkPrerequisites(Long studentId, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        Set<Course> prerequisites = course.getPrerequisites();

        if (prerequisites == null || prerequisites.isEmpty()) {
            return true; // No prerequisites
        }

        // Check if student has completed all prerequisites
        for (Course prereq : prerequisites) {
            boolean completed = enrollmentRepository.existsByStudentIdAndCourseIdAndStatus(
                    studentId, prereq.getId(), EnrollmentStatus.COMPLETED
            );

            if (!completed) {
                return false; // Missing prerequisite
            }
        }

        return true;
    }

    /**
     * Helper method to check for circular dependencies in prerequisites
     */
    private boolean hasCircularDependency(Course prerequisite, Long targetCourseId) {
        if (prerequisite.getId().equals(targetCourseId)) {
            return true;
        }

        if (prerequisite.getPrerequisites() == null || prerequisite.getPrerequisites().isEmpty()) {
            return false;
        }

        for (Course nestedPrereq : prerequisite.getPrerequisites()) {
            if (hasCircularDependency(nestedPrereq, targetCourseId)) {
                return true;
            }
        }

        return false;
    }
}