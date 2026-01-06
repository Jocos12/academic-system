package com.unt.academic_system.service;

import com.unt.academic_system.model.Timetable;

import java.util.List;
import java.util.Optional;

public interface TimetableService {

    Timetable createTimetable(Timetable timetable);
    Optional<Timetable> findById(Long id);
    Timetable updateTimetable(Long id, Timetable timetable);
    void deleteTimetable(Long id);
    List<Timetable> getTimetableByCourse(Long courseId);
    List<Timetable> getStudentTimetable(Long studentId);
    List<Timetable> getLecturerTimetable(Long lecturerId);
    boolean checkTimeConflict(Timetable timetable);
    List<Timetable> findAll();
}