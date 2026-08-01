package com.ledgerly.ledgerly.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ledgerly.ledgerly.entity.AuthRequest;
import com.ledgerly.ledgerly.entity.UserInfo;
import com.ledgerly.ledgerly.service.JwtService;
import com.ledgerly.ledgerly.service.UserInfoService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class UserController {

    private final UserInfoService service;

    private final JwtService jwtService;

    private final AuthenticationManager authenticationManager;

    @GetMapping("/welcome")
    public String welcome() {
        return "Welcome this endpoint is not secure";
    }

    @PostMapping("/signup")
    public ResponseEntity<?> addNewUser(@RequestBody UserInfo userInfo) {
        try {
            System.out.println(userInfo);
            service.addUser(userInfo);
            return new ResponseEntity<>("User Successfully Created" , HttpStatus.CREATED);
        } catch (Exception e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("message", e.getMessage());
            return  new ResponseEntity<>(errorResponse , HttpStatus.BAD_REQUEST);
        }
    }

    // Removed the role checks here as they are already managed in SecurityConfig

   @PostMapping("/login")
    public ResponseEntity<?> authenticateAndGetToken(@RequestBody AuthRequest authRequest) {
    
        try {
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(authRequest.getEmail(), authRequest.getPassword())
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // If authentication succeeds, generate and return the token
            String token = jwtService.generateToken(authRequest.getEmail());
            return ResponseEntity.ok(Map.of("token", token));

        } catch (BadCredentialsException e) {
            System.out.println("Failed: Invalid email or password.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid email or password.");
        } catch (UsernameNotFoundException e) {
            System.out.println("Failed: User not found in database.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found in database.");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An error occurred during authentication.");
        }
    }
}