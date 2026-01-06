package com.unt.academic_system.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import com.unt.academic_system.model.Admin;
import com.unt.academic_system.model.UserRole;
import com.unt.academic_system.repository.AdminRepository;
import com.unt.academic_system.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminServiceImpl implements AdminService {

    private final AdminRepository adminRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public Admin findByEmail(String email) {
        return adminRepository.findByEmail(email);
    }

    @Override
    public Admin registerAdmin(Admin admin) {
        // ✅ AUTO-GENERATE EMPLOYEE ID
        String employeeId = generateEmployeeId();
        admin.setEmployeeId(employeeId);

        if (userRepository.existsByEmail(admin.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        admin.setRole(UserRole.ADMIN);
        admin.setIsActive(true);
        admin.setPassword(passwordEncoder.encode(admin.getPassword()));

        return adminRepository.save(admin);
    }

    /**
     * ✅ METHOD TO AUTO-GENERATE EMPLOYEE ID
     * Format: EMP1, EMP2, EMP3, etc.
     */
    private String generateEmployeeId() {
        // Find the highest employee ID number
        List<Admin> allAdmins = adminRepository.findAll();

        int maxNumber = 0;
        for (Admin admin : allAdmins) {
            String empId = admin.getEmployeeId();
            if (empId != null && empId.startsWith("EMP")) {
                try {
                    int number = Integer.parseInt(empId.substring(3));
                    if (number > maxNumber) {
                        maxNumber = number;
                    }
                } catch (NumberFormatException e) {
                    // Ignore invalid format
                }
            }
        }

        // Generate next employee ID
        return "EMP" + (maxNumber + 1);
    }

    @Override
    public Optional<Admin> findById(Long id) {
        return adminRepository.findById(id);
    }

    @Override
    public Optional<Admin> findByEmployeeId(String employeeId) {
        return adminRepository.findByEmployeeId(employeeId);
    }

    @Override
    public Admin updateAdmin(Long id, Admin updatedAdmin) {
        Admin existing = adminRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Admin not found"));

        existing.setFirstName(updatedAdmin.getFirstName());
        existing.setLastName(updatedAdmin.getLastName());
        existing.setPhoneNumber(updatedAdmin.getPhoneNumber());
        existing.setDepartment(updatedAdmin.getDepartment());
        existing.setAccessLevel(updatedAdmin.getAccessLevel());

        // ✅ DON'T UPDATE EMPLOYEE ID - IT'S AUTO-GENERATED AND SHOULD REMAIN UNCHANGED

        return adminRepository.save(existing);
    }

    @Override
    public List<Admin> getAllAdmins() {
        return adminRepository.findAll();
    }

    @Override
    public List<Admin> getAdminsByDepartment(String department) {
        return adminRepository.findByDepartment(department);
    }

    @Override
    public List<Admin> getAdminsByAccessLevel(String accessLevel) {
        return adminRepository.findByAccessLevel(accessLevel);
    }
}