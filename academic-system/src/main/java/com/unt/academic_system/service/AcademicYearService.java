package com.unt.academic_system.service;

import com.unt.academic_system.model.AcademicYear;

import java.util.List;
import java.util.Optional;

public interface AcademicYearService {

    AcademicYear createAcademicYear(AcademicYear academicYear);
    Optional<AcademicYear> findById(Long id);
    Optional<AcademicYear> findByYearCode(String yearCode);
    Optional<AcademicYear> getCurrentAcademicYear();
    AcademicYear updateAcademicYear(Long id, AcademicYear academicYear);
    List<AcademicYear> getAllAcademicYears();
    List<AcademicYear> getActiveAcademicYears();
    void setCurrentAcademicYear(Long academicYearId);
    void activateAcademicYear(Long academicYearId);
    void deactivateAcademicYear(Long academicYearId);
    void deleteAcademicYear(Long academicYearId);
}