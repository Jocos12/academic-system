package com.unt.academic_system.util;

import com.unt.academic_system.dto.TimetableDTO;
import com.unt.academic_system.dto.CourseContentDTO;
import com.unt.academic_system.model.Timetable;
import com.unt.academic_system.model.CourseContent;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

public class DTOMapper {

    private static final DateTimeFormatter DATE_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    public static TimetableDTO toTimetableDTO(Timetable timetable) {
        TimetableDTO dto = new TimetableDTO();
        dto.setId(timetable.getId());
        dto.setDayOfWeek(timetable.getDayOfWeek().toString());
        dto.setStartTime(timetable.getStartTime());
        dto.setEndTime(timetable.getEndTime());
        dto.setClassroom(timetable.getClassroom());
        dto.setBuilding(timetable.getBuilding());
        dto.setClassType(timetable.getClassType().toString());

        if (timetable.getCourse() != null) {
            dto.setCourseId(timetable.getCourse().getId());
            dto.setCourseName(timetable.getCourse().getCourseName());
            dto.setCourseCode(timetable.getCourse().getCourseCode());

            if (timetable.getCourse().getLecturer() != null) {
                dto.setLecturerId(timetable.getCourse().getLecturer().getId());
                dto.setLecturerName(timetable.getCourse().getLecturer().getFirstName() +
                        " " + timetable.getCourse().getLecturer().getLastName());
            }
        }

        if (timetable.getAcademicYear() != null) {
            dto.setAcademicYearId(timetable.getAcademicYear().getId());
            dto.setYearCode(timetable.getAcademicYear().getYearCode());
        }

        return dto;
    }

    public static List<TimetableDTO> toTimetableDTOList(List<Timetable> timetables) {
        return timetables.stream()
                .map(DTOMapper::toTimetableDTO)
                .collect(Collectors.toList());
    }

    public static CourseContentDTO toCourseContentDTO(CourseContent content) {
        CourseContentDTO dto = new CourseContentDTO();
        dto.setId(content.getId());
        dto.setTitle(content.getTitle());
        dto.setDescription(content.getDescription());
        dto.setContentType(content.getContentType().toString());
        dto.setFileName(content.getFileName());
        dto.setFileSize(content.getFileSize());
        dto.setFilePath(content.getFilePath());
        dto.setApprovalStatus(content.getApprovalStatus().toString());
        dto.setRejectionReason(content.getRejectionReason());

        if (content.getUploadedAt() != null) {
            dto.setUploadedAt(content.getUploadedAt().format(DATE_FORMATTER));
        }

        if (content.getApprovedAt() != null) {
            dto.setApprovedAt(content.getApprovedAt().format(DATE_FORMATTER));
        }

        if (content.getCourse() != null) {
            dto.setCourseId(content.getCourse().getId());
            dto.setCourseName(content.getCourse().getCourseName());
            dto.setCourseCode(content.getCourse().getCourseCode());
        }

        if (content.getLecturer() != null) {
            dto.setLecturerId(content.getLecturer().getId());
            dto.setLecturerName(content.getLecturer().getFirstName() +
                    " " + content.getLecturer().getLastName());
        }

        if (content.getApprovedBy() != null) {
            dto.setApprovedById(content.getApprovedBy().getId());
            dto.setApprovedByName(content.getApprovedBy().getFirstName() +
                    " " + content.getApprovedBy().getLastName());
        }

        return dto;
    }

    public static List<CourseContentDTO> toCourseContentDTOList(List<CourseContent> contents) {
        return contents.stream()
                .map(DTOMapper::toCourseContentDTO)
                .collect(Collectors.toList());
    }
}