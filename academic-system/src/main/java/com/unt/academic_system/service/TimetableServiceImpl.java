package com.unt.academic_system.service;

import com.unt.academic_system.model.Timetable;
import com.unt.academic_system.model.Enrollment;
import com.unt.academic_system.repository.TimetableRepository;
import com.unt.academic_system.repository.EnrollmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TimetableServiceImpl implements TimetableService {

    private final TimetableRepository timetableRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Override
    @Transactional
    public Timetable createTimetable(Timetable timetable) {
        log.info("Creating timetable for course: {}", timetable.getCourse().getId());

        if (checkTimeConflict(timetable)) {
            throw new RuntimeException("Time conflict detected with existing schedule");
        }

        return timetableRepository.save(timetable);
    }

    @Override
    public List<Timetable> findAll() {
        log.info("Fetching all timetables");
        return timetableRepository.findAll();
    }

    @Override
    public Optional<Timetable> findById(Long id) {
        log.info("Fetching timetable by id: {}", id);
        return timetableRepository.findById(id);
    }

    @Override
    @Transactional
    public Timetable updateTimetable(Long id, Timetable updatedTimetable) {
        log.info("Updating timetable id: {}", id);

        Timetable existing = timetableRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Timetable entry not found with id: " + id));

        existing.setDayOfWeek(updatedTimetable.getDayOfWeek());
        existing.setStartTime(updatedTimetable.getStartTime());
        existing.setEndTime(updatedTimetable.getEndTime());
        existing.setClassroom(updatedTimetable.getClassroom());
        existing.setBuilding(updatedTimetable.getBuilding());
        existing.setClassType(updatedTimetable.getClassType());

        if (checkTimeConflict(existing)) {
            throw new RuntimeException("Time conflict detected with existing schedule");
        }

        return timetableRepository.save(existing);
    }

    @Override
    @Transactional
    public void deleteTimetable(Long id) {
        log.info("Deleting timetable id: {}", id);

        if (!timetableRepository.existsById(id)) {
            throw new RuntimeException("Timetable entry not found with id: " + id);
        }

        timetableRepository.deleteById(id);
    }

    @Override
    public List<Timetable> getTimetableByCourse(Long courseId) {
        log.info("Fetching timetable for course id: {}", courseId);
        return timetableRepository.findByCourseId(courseId);
    }





    @Override
    public List<Timetable> getStudentTimetable(Long studentId) {
        log.info("============================================");
        log.info("🔍 TIMETABLE DEBUG FOR STUDENT {}", studentId);
        log.info("============================================");

        try {
            // Step 1: Check enrollments
            log.info("📋 Step 1: Checking student enrollments...");
            List<Enrollment> enrollments = enrollmentRepository.findByStudentId(studentId);
            log.info("✅ Found {} enrollments", enrollments.size());

            if (enrollments.isEmpty()) {
                log.warn("⚠️ NO ENROLLMENTS found for student {}", studentId);
                return List.of();
            }

            // Step 2: Get course IDs
            List<Long> courseIds = enrollments.stream()
                    .map(e -> e.getCourse().getId())
                    .collect(java.util.stream.Collectors.toList());

            log.info("📚 Student enrolled in courses: {}", courseIds);

            // Step 3: Manually fetch timetables for these courses
            log.info("🔍 Fetching timetables for enrolled courses...");
            List<Timetable> allTimetables = new java.util.ArrayList<>();

            for (Long courseId : courseIds) {
                List<Timetable> courseTimetables = timetableRepository.findByCourseId(courseId);
                log.info("   Course {}: {} timetable entries", courseId, courseTimetables.size());

                if (courseTimetables.isEmpty()) {
                    log.warn("   ❌ NO timetables for course {}", courseId);
                } else {
                    for (Timetable tt : courseTimetables) {
                        log.info("      ✅ Found: day={}, time={}-{}, classroom={}",
                                tt.getDayOfWeek(), tt.getStartTime(), tt.getEndTime(), tt.getClassroom());
                    }
                    allTimetables.addAll(courseTimetables);
                }
            }

            log.info("📊 Total timetables found: {}", allTimetables.size());

            if (allTimetables.isEmpty()) {
                log.error("❌ NO TIMETABLES found for any enrolled course!");
                log.error("   This means timetable entries need to be created in the database");
                return List.of();
            }

            // Step 4: Force load lazy fields to avoid LazyInitializationException
            log.info("🔄 Initializing lazy-loaded fields...");
            for (Timetable t : allTimetables) {
                // Force load course
                if (t.getCourse() != null) {
                    t.getCourse().getId(); // Trigger load
                    t.getCourse().getCourseName();
                    t.getCourse().getCourseCode();

                    // Force load lecturer
                    if (t.getCourse().getLecturer() != null) {
                        t.getCourse().getLecturer().getId(); // Trigger load
                        t.getCourse().getLecturer().getFirstName();
                        t.getCourse().getLecturer().getLastName();
                    }
                }

                // Force load academic year
                if (t.getAcademicYear() != null) {
                    t.getAcademicYear().getId(); // Trigger load
                    t.getAcademicYear().getYearCode();
                }

                log.info("   ✅ Loaded: {} on {} at {} in {}",
                        t.getCourse() != null ? t.getCourse().getCourseCode() : "NULL",
                        t.getDayOfWeek(),
                        t.getStartTime(),
                        t.getClassroom());
            }

            // Step 5: Sort by day and time
            allTimetables.sort((t1, t2) -> {
                int dayCompare = t1.getDayOfWeek().compareTo(t2.getDayOfWeek());
                if (dayCompare != 0) return dayCompare;
                return t1.getStartTime().compareTo(t2.getStartTime());
            });

            log.info("============================================");
            log.info("✅ TIMETABLE DEBUG COMPLETE - Returning {} entries", allTimetables.size());
            log.info("============================================");

            return allTimetables;

        } catch (Exception e) {
            log.error("❌ FATAL ERROR fetching timetable for student {}", studentId, e);
            throw new RuntimeException("Failed to fetch student timetable: " + e.getMessage());
        }
    }




    @Override
    public List<Timetable> getLecturerTimetable(Long lecturerId) {
        log.info("Fetching timetable for lecturer id: {}", lecturerId);

        try {
            List<Timetable> timetables = timetableRepository.findLecturerTimetable(lecturerId);
            log.info("Found {} timetable entries for lecturer {}", timetables.size(), lecturerId);

            timetables.forEach(t -> {
                if (t.getCourse() != null) {
                    t.getCourse().getCourseName();
                    if (t.getCourse().getLecturer() != null) {
                        t.getCourse().getLecturer().getFirstName();
                    }
                }
                if (t.getAcademicYear() != null) {
                    t.getAcademicYear().getYearCode();
                }
            });

            return timetables;
        } catch (Exception e) {
            log.error("Error fetching timetable for lecturer {}: {}", lecturerId, e.getMessage(), e);
            throw new RuntimeException("Failed to fetch lecturer timetable: " + e.getMessage());
        }
    }

    @Override
    public boolean checkTimeConflict(Timetable newEntry) {
        log.debug("Checking time conflict for day: {}", newEntry.getDayOfWeek());

        List<Timetable> sameDayEntries = timetableRepository.findByDayOfWeek(newEntry.getDayOfWeek());

        for (Timetable existing : sameDayEntries) {
            if (existing.getId() != null && existing.getId().equals(newEntry.getId())) {
                continue;
            }

            if (existing.getClassroom() != null &&
                    existing.getClassroom().equals(newEntry.getClassroom())) {
                if (timesOverlap(existing.getStartTime(), existing.getEndTime(),
                        newEntry.getStartTime(), newEntry.getEndTime())) {
                    log.warn("Classroom conflict detected: {} at {}",
                            newEntry.getClassroom(), newEntry.getStartTime());
                    return true;
                }
            }

            if (existing.getCourse() != null && existing.getCourse().getLecturer() != null &&
                    newEntry.getCourse() != null && newEntry.getCourse().getLecturer() != null) {
                if (existing.getCourse().getLecturer().getId().equals(
                        newEntry.getCourse().getLecturer().getId())) {
                    if (timesOverlap(existing.getStartTime(), existing.getEndTime(),
                            newEntry.getStartTime(), newEntry.getEndTime())) {
                        log.warn("Lecturer conflict detected for lecturer: {}",
                                newEntry.getCourse().getLecturer().getId());
                        return true;
                    }
                }
            }
        }

        return false;
    }

    private boolean timesOverlap(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return start1.isBefore(end2) && start2.isBefore(end1);
    }
}