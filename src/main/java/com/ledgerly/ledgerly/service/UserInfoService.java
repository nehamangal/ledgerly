package com.ledgerly.ledgerly.service;

import com.ledgerly.ledgerly.entity.UserInfo;
import com.ledgerly.ledgerly.repository.UserInfoRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserInfoService implements UserDetailsService {

    private final UserInfoRepository repository;
    private final PasswordEncoder encoder;

    public UserInfoService(UserInfoRepository repository, PasswordEncoder encoder) {
        this.repository = repository;
        this.encoder = encoder;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Fetch user from the database by email (email)
        Optional<UserInfo> userInfo = repository.findByEmail(email);
        
        // Return your custom UserInfoDetails instead of Spring's default User
        return userInfo.map(UserInfoDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
    }

    public String addUser(UserInfo userInfo) {
        // Encrypt password before saving
        userInfo.setPassword(encoder.encode(userInfo.getPassword())); 
        userInfo.setRoles(userInfo.getRoles() != null ? userInfo.getRoles() : "ROLE_USER");
        repository.save(userInfo);
        return "User added successfully!";
    }
}