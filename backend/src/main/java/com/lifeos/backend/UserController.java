package com.lifeos.backend;

import com.lifeos.backend.model.User;
import com.lifeos.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userService.getAllUsers();
    }

    @PostMapping
    public User createUser(
            @Valid @RequestBody User user
    ) {
        return userService.createUser(user);
    }

    @PostMapping("/login")
    public String login(
            @Valid @RequestBody LoginRequest request
    ) {
        return userService.login(
                request.getLogin(),
                request.getPassword()
        );
    }

    // Check whether email is already registered
    @GetMapping("/check-email")
    public boolean checkEmail(
            @RequestParam String email
    ) {
        return userService.emailExists(email);
    }

    // Check whether phone number is already registered
    @GetMapping("/check-phone")
    public boolean checkPhone(
            @RequestParam String phone
    ) {
        return userService.phoneExists(phone);
    }
}