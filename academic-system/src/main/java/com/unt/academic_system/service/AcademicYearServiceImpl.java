package com.unt.academic_system.service;

import com.unt.academic_system.model.AcademicYear;
import com.unt.academic_system.repository.AcademicYearRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicYearServiceImpl implements AcademicYearService {

    private final AcademicYearRepository academicYearRepository;

    @Override
    public AcademicYear createAcademicYear(AcademicYear academicYear) {
        // Check if year code already exists
        if (academicYearRepository.findByYearCode(academicYear.getYearCode()).isPresent()) {
            throw new RuntimeException("Academic year already exists");
        }

        academicYear.setIsActive(false);
        academicYear.setIsCurrent(false);

        return academicYearRepository.save(academicYear);
    }

    @Override
    public Optional<AcademicYear> findById(Long id) {
        return academicYearRepository.findById(id);
    }

    @Override
    public Optional<AcademicYear> findByYearCode(String yearCode) {
        return academicYearRepository.findByYearCode(yearCode);
    }

    @Override
    public Optional<AcademicYear> getCurrentAcademicYear() {
        return academicYearRepository.findByIsCurrentTrue();
    }

    @Override
    public AcademicYear updateAcademicYear(Long id, AcademicYear updatedAcademicYear) {
        AcademicYear existing = academicYearRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Academic year not found"));

        existing.setStartDate(updatedAcademicYear.getStartDate());
        existing.setEndDate(updatedAcademicYear.getEndDate());
        existing.setRegistrationStartDate(updatedAcademicYear.getRegistrationStartDate());
        existing.setRegistrationEndDate(updatedAcademicYear.getRegistrationEndDate());
        existing.setExamStartDate(updatedAcademicYear.getExamStartDate());
        existing.setExamEndDate(updatedAcademicYear.getExamEndDate());

        return academicYearRepository.save(existing);
    }

    @Override
    public List<AcademicYear> getAllAcademicYears() {
        return academicYearRepository.findAll();
    }

    @Override
    public List<AcademicYear> getActiveAcademicYears() {
        return academicYearRepository.findByIsActiveTrue();
    }

    @Override
    public void setCurrentAcademicYear(Long academicYearId) {
        // First, set all academic years to not current
        Optional<AcademicYear> currentYear = academicYearRepository.findByIsCurrentTrue();
        currentYear.ifPresent(year -> {
            year.setIsCurrent(false);
            academicYearRepository.save(year);
        });

        // Then set the specified year as current
        AcademicYear newCurrentYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new RuntimeException("Academic year not found"));

        newCurrentYear.setIsCurrent(true);
        newCurrentYear.setIsActive(true);
        academicYearRepository.save(newCurrentYear);
    }

    @Override
    public void activateAcademicYear(Long academicYearId) {
        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new RuntimeException("Academic year not found"));

        academicYear.setIsActive(true);
        academicYearRepository.save(academicYear);
    }

    @Override
    public void deactivateAcademicYear(Long academicYearId) {
        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new RuntimeException("Academic year not found"));

        academicYear.setIsActive(false);
        academicYear.setIsCurrent(false);
        academicYearRepository.save(academicYear);
    }

    @Override
    public void deleteAcademicYear(Long academicYearId) {
        AcademicYear academicYear = academicYearRepository.findById(academicYearId)
                .orElseThrow(() -> new RuntimeException("Academic year not found"));

        // Prevent deletion of current academic year
        if (academicYear.getIsCurrent()) {
            throw new RuntimeException("Cannot delete the current academic year");
        }

        academicYearRepository.deleteById(academicYearId);
    }
}