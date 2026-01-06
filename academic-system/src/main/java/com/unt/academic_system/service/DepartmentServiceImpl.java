package com.unt.academic_system.service;

import com.unt.academic_system.model.Department;
import com.unt.academic_system.model.Lecturer;
import com.unt.academic_system.repository.DepartmentRepository;
import com.unt.academic_system.repository.LecturerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentServiceImpl implements DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final LecturerRepository lecturerRepository;

    @Override
    public Department createDepartment(Department department) {
        if (departmentRepository.findByCode(department.getCode()).isPresent()) {
            throw new RuntimeException("Department code already exists");
        }

        department.setIsActive(true);
        return departmentRepository.save(department);
    }

    @Override
    public Optional<Department> findById(Long id) {
        return departmentRepository.findById(id);
    }

    @Override
    public Optional<Department> findByCode(String code) {
        return departmentRepository.findByCode(code);
    }

    @Override
    public Department updateDepartment(Long id, Department updatedDepartment) {
        Department existing = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        existing.setName(updatedDepartment.getName());
        existing.setDescription(updatedDepartment.getDescription());

        return departmentRepository.save(existing);
    }

    @Override
    public void deleteDepartment(Long id) {
        Department department = departmentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        departmentRepository.delete(department);  // Changed from setIsActive(false) to delete()
    }

    @Override
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }

    @Override
    public List<Department> getDepartmentsByFaculty(Long facultyId) {
        return departmentRepository.findByFacultyId(facultyId);
    }

    @Override
    public List<Department> getActiveDepartments() {
        return departmentRepository.findByIsActiveTrue();
    }

    @Override
    public void assignHead(Long departmentId, Long lecturerId) {
        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new RuntimeException("Department not found"));

        Lecturer head = lecturerRepository.findById(lecturerId)
                .orElseThrow(() -> new RuntimeException("Lecturer not found"));

        department.setHead(head);
        departmentRepository.save(department);
    }
}