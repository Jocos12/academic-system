package com.unt.academic_system.service;

import com.unt.academic_system.model.Department;

import java.util.List;
import java.util.Optional;

public interface DepartmentService {

    Department createDepartment(Department department);
    Optional<Department> findById(Long id);
    Optional<Department> findByCode(String code);
    Department updateDepartment(Long id, Department department);
    void deleteDepartment(Long id);
    List<Department> getAllDepartments();
    List<Department> getDepartmentsByFaculty(Long facultyId);
    List<Department> getActiveDepartments();
    void assignHead(Long departmentId, Long lecturerId);
}