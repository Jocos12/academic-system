package com.unt.academic_system.service;

import com.unt.academic_system.model.Course;
import com.unt.academic_system.model.Lecturer;
import com.unt.academic_system.model.UserRole;
import com.unt.academic_system.repository.CourseRepository;
import com.unt.academic_system.repository.LecturerRepository;
import com.unt.academic_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class LecturerServiceImpl implements LecturerService {

    private static final Logger logger = LoggerFactory.getLogger(LecturerServiceImpl.class);

    private final LecturerRepository lecturerRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;

    @Override
    @Transactional
    public Lecturer registerLecturer(Lecturer lecturer) {
        logger.info("🔵 Registering new lecturer: {}", lecturer.getEmail());

        if (lecturerRepository.existsByEmployeeId(lecturer.getEmployeeId())) {
            logger.error("❌ Employee ID already exists: {}", lecturer.getEmployeeId());
            throw new RuntimeException("Employee ID already exists");
        }

        if (userRepository.existsByEmail(lecturer.getEmail())) {
            logger.error("❌ Email already exists: {}", lecturer.getEmail());
            throw new RuntimeException("Email already exists");
        }

        lecturer.setRole(UserRole.LECTURER);
        lecturer.setIsActive(true);

        Lecturer saved = lecturerRepository.save(lecturer);
        logger.info("✅ Lecturer registered successfully with ID: {}", saved.getId());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Lecturer> findByEmail(String email) {
        return lecturerRepository.findByEmail(email);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Lecturer> findById(Long id) {
        return lecturerRepository.findById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Lecturer> findByEmployeeId(String employeeId) {
        return lecturerRepository.findByEmployeeId(employeeId);
    }

    @Override
    @Transactional
    public Lecturer updateLecturer(Long id, Lecturer updatedLecturer) {
        logger.info("🔵 Updating lecturer with ID: {}", id);

        Lecturer existing = lecturerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        // Update only non-null fields
        if (updatedLecturer.getFirstName() != null) {
            existing.setFirstName(updatedLecturer.getFirstName());
        }
        if (updatedLecturer.getLastName() != null) {
            existing.setLastName(updatedLecturer.getLastName());
        }
        if (updatedLecturer.getPhoneNumber() != null) {
            existing.setPhoneNumber(updatedLecturer.getPhoneNumber());
        }
        if (updatedLecturer.getDepartment() != null) {
            existing.setDepartment(updatedLecturer.getDepartment());
        }
        if (updatedLecturer.getQualification() != null) {
            existing.setQualification(updatedLecturer.getQualification());
        }
        if (updatedLecturer.getSpecialization() != null) {
            existing.setSpecialization(updatedLecturer.getSpecialization());
        }
        if (updatedLecturer.getOfficeLocation() != null) {
            existing.setOfficeLocation(updatedLecturer.getOfficeLocation());
        }
        if (updatedLecturer.getOfficeHours() != null) {
            existing.setOfficeHours(updatedLecturer.getOfficeHours());
        }

        Lecturer saved = lecturerRepository.save(existing);
        logger.info("✅ Lecturer updated successfully");
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lecturer> getAllLecturers() {
        return lecturerRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lecturer> getLecturersByDepartment(String department) {
        return lecturerRepository.findByDepartment(department);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Lecturer> getLecturersByQualification(String qualification) {
        return lecturerRepository.findByQualification(qualification);
    }

    @Override
    @Transactional
    public void assignCourse(Long lecturerId, Long courseId) {
        logger.info("🔵 Assigning course {} to lecturer {}", courseId, lecturerId);

        Lecturer lecturer = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found with ID: " + lecturerId));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found with ID: " + courseId));

        // Remove from old lecturer if exists
        if (course.getLecturer() != null && !course.getLecturer().getId().equals(lecturerId)) {
            Lecturer oldLecturer = course.getLecturer();
            oldLecturer.getCourses().remove(course);
            lecturerRepository.save(oldLecturer);
            logger.info("📝 Removed course from old lecturer: {}", oldLecturer.getId());
        }

        // Assign new lecturer (only set the owning side)
        course.setLecturer(lecturer);
        courseRepository.save(course);

        logger.info("✅ Course {} assigned to lecturer {}", courseId, lecturerId);
    }

    @Override
    @Transactional
    public void assignMultipleCourses(Long lecturerId, List<Long> courseIds) {
        logger.info("🔵 ========================================");
        logger.info("🔵 STARTING MULTIPLE COURSES ASSIGNMENT");
        logger.info("🔵 Lecturer ID: {}", lecturerId);
        logger.info("🔵 Course IDs to assign: {}", courseIds);
        logger.info("🔵 ========================================");

        try {
            // 1. Verify lecturer exists
            Lecturer lecturer = lecturerRepository.findById(lecturerId)
                    .orElseThrow(() -> new RuntimeException("Lecturer not found with ID: " + lecturerId));

            logger.info("✅ Lecturer found: {} {} (ID: {})",
                    lecturer.getFirstName(), lecturer.getLastName(), lecturer.getId());

            // 2. Get ALL courses currently assigned to this lecturer
            List<Course> currentCourses = courseRepository.findByLecturerId(lecturerId);
            logger.info("📝 Current courses assigned: {}", currentCourses.size());

            // 3. UNASSIGN ALL current courses
            if (!currentCourses.isEmpty()) {
                logger.info("🔄 Unassigning {} current courses...", currentCourses.size());
                for (Course course : currentCourses) {
                    logger.info("   - Unassigning: {} (ID: {})", course.getCourseCode(), course.getId());
                    course.setLecturer(null);
                }
                courseRepository.saveAll(currentCourses);
                courseRepository.flush();
                logger.info("✅ All current courses unassigned and flushed to DB");
            }

            // 4. ASSIGN NEW courses (if any)
            if (courseIds != null && !courseIds.isEmpty()) {
                logger.info("🔄 Assigning {} new courses...", courseIds.size());

                for (Long courseId : courseIds) {
                    Course course = courseRepository.findById(courseId)
                            .orElseThrow(() -> new RuntimeException("Course not found with ID: " + courseId));

                    logger.info("   📚 Course: {} - {}", course.getCourseCode(), course.getCourseName());

                    // Check if already assigned to another lecturer
                    if (course.getLecturer() != null && !course.getLecturer().getId().equals(lecturerId)) {
                        logger.warn("      ⚠️  Course was assigned to lecturer ID: {}. Reassigning...",
                                course.getLecturer().getId());
                    }

                    // Assign to new lecturer
                    course.setLecturer(lecturer);

                    // Save immediately
                    courseRepository.save(course);
                    logger.info("      ✅ Course assigned and saved");
                }

                // Final flush
                courseRepository.flush();
                logger.info("✅ All new courses flushed to database");
            } else {
                logger.info("📝 No new courses to assign (courseIds is null or empty)");
            }

            // 5. VERIFICATION - Query database directly
            logger.info("🔍 ========================================");
            logger.info("🔍 VERIFICATION - Querying database...");
            List<Course> verificationCourses = courseRepository.findByLecturerId(lecturerId);
            logger.info("🔍 Total courses found in DB for lecturer {}: {}", lecturerId, verificationCourses.size());

            for (Course c : verificationCourses) {
                logger.info("   ✓ {} - {} (Course ID: {}, Lecturer ID: {})",
                        c.getCourseCode(),
                        c.getCourseName(),
                        c.getId(),
                        c.getLecturer() != null ? c.getLecturer().getId() : "NULL");
            }

            // Check if verification matches expectation
            int expectedCount = (courseIds != null) ? courseIds.size() : 0;
            if (verificationCourses.size() != expectedCount) {
                logger.error("❌ VERIFICATION FAILED!");
                logger.error("   Expected: {} courses", expectedCount);
                logger.error("   Found: {} courses", verificationCourses.size());
                throw new RuntimeException("Course assignment verification failed! Expected " +
                        expectedCount + " but found " + verificationCourses.size());
            }

            logger.info("🎉 ========================================");
            logger.info("🎉 ASSIGNMENT COMPLETED SUCCESSFULLY");
            logger.info("🎉 Total courses assigned: {}", verificationCourses.size());
            logger.info("🎉 ========================================");

        } catch (Exception e) {
            logger.error("❌ ========================================");
            logger.error("❌ CRITICAL ERROR in assignMultipleCourses");
            logger.error("❌ Lecturer ID: {}", lecturerId);
            logger.error("❌ Error: {}", e.getMessage(), e);
            logger.error("❌ ========================================");
            throw new RuntimeException("Failed to assign courses: " + e.getMessage(), e);
        }
    }



    @Override
    @Transactional
    public void assignMultipleCoursesNative(Long lecturerId, List<Long> courseIds) {
        logger.info("🔵 ========================================");
        logger.info("🔵 SERVICE: Starting assignMultipleCoursesNative");
        logger.info("🔵 Lecturer ID: {}", lecturerId);
        logger.info("🔵 Course IDs to assign: {}", courseIds);
        logger.info("🔵 Transaction active: {}", TransactionSynchronizationManager.isActualTransactionActive());
        logger.info("🔵 ========================================");

        try {
            // Step 1: Verify lecturer exists
            logger.info("📝 Step 1: Verifying lecturer exists...");
            Lecturer lecturer = lecturerRepository.findById(lecturerId)
                    .orElseThrow(() -> new RuntimeException("Lecturer not found with ID: " + lecturerId));

            logger.info("✅ Lecturer found: {} {} (ID: {})",
                    lecturer.getFirstName(), lecturer.getLastName(), lecturer.getId());

            // Step 2: Get current courses
            logger.info("📝 Step 2: Fetching current courses...");
            List<Course> currentCourses = courseRepository.findByLecturerId(lecturerId);
            logger.info("📊 Current courses assigned to lecturer {}: {}", lecturerId, currentCourses.size());

            for (Course c : currentCourses) {
                logger.info("   - Current: {} (ID: {}, Lecturer ID: {})",
                        c.getCourseCode(), c.getId(),
                        c.getLecturer() != null ? c.getLecturer().getId() : "NULL");
            }

            // Step 3: UNASSIGN all current courses using native query
            if (!currentCourses.isEmpty()) {
                logger.info("📝 Step 3: Unassigning {} current courses using NATIVE SQL...", currentCourses.size());

                for (Course course : currentCourses) {
                    logger.info("   🔄 Unassigning course ID: {}", course.getId());

                    int rowsAffected = courseRepository.unassignLecturerFromCourse(course.getId());

                    logger.info("   ✅ SQL UPDATE executed - Rows affected: {}", rowsAffected);

                    if (rowsAffected == 0) {
                        logger.error("   ❌ WARNING: No rows were updated for course ID: {}", course.getId());
                    }
                }

                logger.info("✅ All current courses unassigned via native SQL");
            } else {
                logger.info("📝 No current courses to unassign");
            }

            // Step 4: ASSIGN new courses using native query
            if (courseIds != null && !courseIds.isEmpty()) {
                logger.info("📝 Step 4: Assigning {} NEW courses using NATIVE SQL...", courseIds.size());

                for (Long courseId : courseIds) {
                    logger.info("   🔄 Processing course ID: {}", courseId);

                    // Verify course exists
                    Course course = courseRepository.findById(courseId)
                            .orElseThrow(() -> new RuntimeException("Course not found: " + courseId));

                    logger.info("   📚 Course found: {} - {}", course.getCourseCode(), course.getCourseName());
                    logger.info("   📊 Current lecturer_id in course object: {}",
                            course.getLecturer() != null ? course.getLecturer().getId() : "NULL");

                    // Execute native SQL UPDATE
                    logger.info("   💾 Executing SQL: UPDATE courses SET lecturer_id = {} WHERE id = {}",
                            lecturerId, courseId);

                    int rowsAffected = courseRepository.assignLecturerToCourse(courseId, lecturerId);

                    logger.info("   ✅ SQL UPDATE executed - Rows affected: {}", rowsAffected);

                    if (rowsAffected == 0) {
                        logger.error("   ❌ CRITICAL: No rows were updated for course ID: {}", courseId);
                        throw new RuntimeException("Failed to assign course " + courseId + " - no rows affected");
                    } else if (rowsAffected > 1) {
                        logger.error("   ❌ CRITICAL: Multiple rows updated ({})", rowsAffected);
                        throw new RuntimeException("Database error: multiple rows affected");
                    }

                    // Verify immediately after update
                    Course verifiedCourse = courseRepository.findById(courseId).orElse(null);
                    if (verifiedCourse != null && verifiedCourse.getLecturer() != null) {
                        logger.info("   ✓ VERIFICATION: lecturer_id is now: {}",
                                verifiedCourse.getLecturer().getId());
                    } else {
                        logger.error("   ❌ VERIFICATION FAILED: lecturer_id is still NULL after update!");
                    }
                }

                logger.info("✅ All new courses assigned via native SQL");

            } else {
                logger.info("📝 No new courses to assign (courseIds is null or empty)");
            }

            // Step 5: FINAL VERIFICATION
            logger.info("📝 Step 5: FINAL VERIFICATION...");
            logger.info("🔍 ========================================");
            logger.info("🔍 Querying database for lecturer {} courses...", lecturerId);

            List<Course> verificationCourses = courseRepository.findByLecturerId(lecturerId);

            logger.info("🔍 TOTAL courses found in DB: {}", verificationCourses.size());
            logger.info("🔍 Expected courses: {}", courseIds != null ? courseIds.size() : 0);

            for (Course c : verificationCourses) {
                logger.info("   ✓ {} - {} (Course ID: {}, Lecturer ID: {})",
                        c.getCourseCode(),
                        c.getCourseName(),
                        c.getId(),
                        c.getLecturer() != null ? c.getLecturer().getId() : "NULL");
            }

            // Verify count matches
            int expectedCount = (courseIds != null) ? courseIds.size() : 0;
            if (verificationCourses.size() != expectedCount) {
                logger.error("❌ VERIFICATION MISMATCH!");
                logger.error("   Expected: {} courses", expectedCount);
                logger.error("   Found: {} courses", verificationCourses.size());
                logger.error("   Missing courses!");

                throw new RuntimeException(
                        "Verification failed: Expected " + expectedCount +
                                " courses but found " + verificationCourses.size()
                );
            }

            logger.info("🎉 ========================================");
            logger.info("🎉 SUCCESS: Assignment verified successfully");
            logger.info("🎉 Total courses assigned: {}", verificationCourses.size());
            logger.info("🎉 ========================================");

        } catch (Exception e) {
            logger.error("❌ ========================================");
            logger.error("❌ CRITICAL ERROR in assignMultipleCoursesNative");
            logger.error("❌ Lecturer ID: {}", lecturerId);
            logger.error("❌ Course IDs: {}", courseIds);
            logger.error("❌ Error type: {}", e.getClass().getName());
            logger.error("❌ Error message: {}", e.getMessage());
            logger.error("❌ Stack trace:", e);
            logger.error("❌ ========================================");

            throw new RuntimeException("Failed to assign courses: " + e.getMessage(), e);
        }
    }

    @Override
    @Transactional
    public void unassignCourse(Long lecturerId, Long courseId) {
        logger.info("🔵 Unassigning course {} from lecturer {}", courseId, lecturerId);

        Lecturer lecturer = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (course.getLecturer() != null && course.getLecturer().getId().equals(lecturerId)) {
            course.setLecturer(null);
            courseRepository.save(course);
            logger.info("✅ Course unassigned successfully");
        } else {
            logger.error("❌ This course is not assigned to this lecturer");
            throw new RuntimeException("This course is not assigned to this lecturer");
        }
    }

    @Override
    @Transactional
    public void deleteLecturer(Long id) {
        logger.info("🔵 Deleting lecturer with ID: {}", id);

        Lecturer lecturer = lecturerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        // Unassign all courses first
        List<Course> courses = courseRepository.findByLecturerId(id);
        logger.info("📝 Unassigning {} courses", courses.size());

        for (Course course : courses) {
            course.setLecturer(null);
        }
        courseRepository.saveAll(courses);

        // Delete lecturer
        lecturerRepository.delete(lecturer);
        logger.info("✅ Lecturer deleted successfully");
    }
}