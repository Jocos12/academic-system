package com.unt.academic_system.controller;

import com.unt.academic_system.dto.TimetableDTO;
import com.unt.academic_system.model.Timetable;
import com.unt.academic_system.service.TimetableService;
import com.unt.academic_system.util.DTOMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/timetable")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class TimetableController {

    private final TimetableService timetableService;

    @GetMapping
    public ResponseEntity<List<TimetableDTO>> getAllTimetables() {
        try {
            log.info("GET /api/timetable - Fetching all timetables");
            List<Timetable> timetables = timetableService.findAll();
            List<TimetableDTO> dtos = DTOMapper.toTimetableDTOList(timetables);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching all timetables: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createTimetable(@RequestBody Timetable timetable) {
        try {
            log.info("POST /api/timetable - Creating timetable");
            Timetable created = timetableService.createTimetable(timetable);
            TimetableDTO dto = DTOMapper.toTimetableDTO(created);
            return ResponseEntity.status(HttpStatus.CREATED).body(dto);
        } catch (RuntimeException e) {
            log.error("Error creating timetable: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error creating timetable: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to create timetable");
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getTimetableById(@PathVariable Long id) {
        try {
            log.info("GET /api/timetable/{} - Fetching timetable", id);
            Optional<Timetable> timetable = timetableService.findById(id);
            return timetable.map(t -> ResponseEntity.ok(DTOMapper.toTimetableDTO(t)))
                    .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).build());
        } catch (Exception e) {
            log.error("Error fetching timetable {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<TimetableDTO>> getTimetableByCourse(@PathVariable Long courseId) {
        try {
            log.info("GET /api/timetable/course/{} - Fetching course timetable", courseId);
            List<Timetable> timetables = timetableService.getTimetableByCourse(courseId);
            List<TimetableDTO> dtos = DTOMapper.toTimetableDTOList(timetables);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching timetable for course {}: {}", courseId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<TimetableDTO>> getStudentTimetable(@PathVariable Long studentId) {
        try {
            log.info("GET /api/timetable/student/{} - Fetching student timetable", studentId);
            List<Timetable> timetables = timetableService.getStudentTimetable(studentId);
            List<TimetableDTO> dtos = DTOMapper.toTimetableDTOList(timetables);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching timetable for student {}: {}", studentId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/lecturer/{lecturerId}")
    public ResponseEntity<?> getLecturerTimetable(@PathVariable Long lecturerId) {
        try {
            log.info("GET /api/timetable/lecturer/{} - Fetching lecturer timetable", lecturerId);
            List<Timetable> timetables = timetableService.getLecturerTimetable(lecturerId);
            List<TimetableDTO> dtos = DTOMapper.toTimetableDTOList(timetables);
            log.info("Successfully fetched {} timetable entries for lecturer {}", dtos.size(), lecturerId);
            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            log.error("Error fetching timetable for lecturer {}: {}", lecturerId, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to fetch lecturer timetable: " + e.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTimetable(@PathVariable Long id, @RequestBody Timetable timetable) {
        try {
            log.info("PUT /api/timetable/{} - Updating timetable", id);
            Timetable updated = timetableService.updateTimetable(id, timetable);
            TimetableDTO dto = DTOMapper.toTimetableDTO(updated);
            return ResponseEntity.ok(dto);
        } catch (RuntimeException e) {
            log.error("Error updating timetable {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error updating timetable {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update timetable");
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTimetable(@PathVariable Long id) {
        try {
            log.info("DELETE /api/timetable/{} - Deleting timetable", id);
            timetableService.deleteTimetable(id);
            return ResponseEntity.ok("Timetable entry deleted successfully");
        } catch (RuntimeException e) {
            log.error("Error deleting timetable {}: {}", id, e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error deleting timetable {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete timetable");
        }
    }
}