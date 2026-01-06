package com.unt.academic_system.dto;

import lombok.Data;
import java.time.LocalTime;

// ============= TimetableDTO.java =============
@Data
public class TimetableDTO {
    private Long id;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private String classroom;
    private String building;
    private String classType;

    // Nested course info
    private Long courseId;
    private String courseName;
    private String courseCode;

    // Academic year info
    private Long academicYearId;
    private String yearCode;

    // Lecturer info (optional)
    private Long lecturerId;
    private String lecturerName;
}