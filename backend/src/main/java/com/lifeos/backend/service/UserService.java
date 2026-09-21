package com.lifeos.backend.service;

import com.lifeos.backend.JwtService;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.UserRepository;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User createUser(User user) {

        System.out.println("🔥 NEW USERSERVICE CODE IS RUNNING 🔥");

        boolean hasEmail =
                user.getEmail() != null
                        && !user.getEmail().isBlank();

        boolean hasPhone =
                user.getPhone() != null
                        && !user.getPhone().isBlank();

        // User must register using either email OR phone
        if (hasEmail == hasPhone) {
            throw new IllegalArgumentException(
                    "Provide either email or phone number"
            );
        }

        // Check email only if email registration
        if (hasEmail
                && userRepository.findByEmail(user.getEmail()).isPresent()) {

            throw new IllegalArgumentException(
                    "Email already registered"
            );
        }

        // Check phone only if phone registration
        if (hasPhone
                && userRepository.findByPhone(user.getPhone()).isPresent()) {

            throw new IllegalArgumentException(
                    "Phone number already registered"
            );
        }

        // Hash password
        String hashedPassword =
                BCrypt.hashpw(
                        user.getPassword(),
                        BCrypt.gensalt()
                );

        user.setPassword(hashedPassword);

        System.out.println(
                "HASHED PASSWORD = " + hashedPassword
        );

        return userRepository.save(user);
    }

    public String login(
            String login,
            String password
    ) {

        User user;

        /*
         * Login using either:
         *
         * Email
         * OR
         * Phone number
         */

        if (login.contains("@")) {

            user = userRepository
                    .findByEmail(login)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Invalid email/phone or password"
                            )
                    );

        } else {

            user = userRepository
                    .findByPhone(login)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "Invalid email/phone or password"
                            )
                    );
        }

        // Check password
        if (!BCrypt.checkpw(
                password,
                user.getPassword()
        )) {

            throw new IllegalArgumentException(
                    "Invalid email/phone or password"
            );
        }

        // Generate JWT
        // Use email if available, otherwise phone
        String tokenSubject =
                user.getEmail() != null
                        && !user.getEmail().isBlank()
                        ? user.getEmail()
                        : user.getPhone();

        return jwtService.generateToken(tokenSubject);
    }

    // Check whether email is already registered
    public boolean emailExists(String email) {
        return userRepository.existsByEmail(email);
    }

    // Check whether phone number is already registered
    public boolean phoneExists(String phone) {
        return userRepository.existsByPhone(phone);
    }
}