package com.unt.academic_system.service;

import com.unt.academic_system.model.Faculty;
import com.unt.academic_system.model.Lecturer;
import com.unt.academic_system.repository.FacultyRepository;
import com.unt.academic_system.repository.LecturerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class FacultyServiceImpl implements FacultyService {

    private final FacultyRepository facultyRepository;
    private final LecturerRepository lecturerRepository;

    @Override
    public Faculty createFaculty(Faculty faculty) {
        if (facultyRepository.findByCode(faculty.getCode()).isPresent()) {
            throw new RuntimeException("Faculty code already exists");
        }

        faculty.setIsActive(true);
        return facultyRepository.save(faculty);
    }

    @Override
    public Optional<Faculty> findById(Long id) {
        return facultyRepository.findById(id);
    }

    @Override
    public Optional<Faculty> findByCode(String code) {
        return facultyRepository.findByCode(code);
    }

    @Override
    public Faculty updateFaculty(Long id, Faculty updatedFaculty) {
        Faculty existing = facultyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        existing.setName(updatedFaculty.getName());
        existing.setCode(updatedFaculty.getCode());
        existing.setDescription(updatedFaculty.getDescription());
        existing.setDean(updatedFaculty.getDean());
        existing.setIsActive(updatedFaculty.getIsActive());

        return facultyRepository.save(existing);
    }

    @Override
    public void deleteFaculty(Long id) {
        Faculty faculty = facultyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        faculty.setIsActive(false);
        facultyRepository.save(faculty);
    }

    @Override
    public List<Faculty> getAllFaculties() {
        return facultyRepository.findAll();
    }

    @Override
    public List<Faculty> getActiveFaculties() {
        return facultyRepository.findByIsActiveTrue();
    }

    @Override
    public void assignDean(Long facultyId, Long lecturerId) {
        Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new RuntimeException("Faculty not found"));

        Lecturer dean = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        faculty.setDean(dean);
        facultyRepository.save(faculty);
    }
}