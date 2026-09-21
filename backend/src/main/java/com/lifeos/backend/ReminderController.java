package com.lifeos.backend;

import com.lifeos.backend.model.Reminder;
import com.lifeos.backend.service.ReminderService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @GetMapping
    public List<Reminder> getAllReminders(
            @RequestAttribute("userEmail") String email) {

        return reminderService.getAllReminders(email);
    }

    @PostMapping
    public ResponseEntity<Reminder> createReminder(
            @Valid @RequestBody Reminder reminder,
            @RequestAttribute("userEmail") String email) {

        Reminder createdReminder =
                reminderService.createReminder(reminder, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdReminder);
    }

    @PutMapping("/{id}")
    public Reminder updateReminder(
            @PathVariable Long id,
            @Valid @RequestBody Reminder reminder,
            @RequestAttribute("userEmail") String email) {

        return reminderService.updateReminder(
                id,
                reminder,
                email
        );
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteReminder(
            @PathVariable Long id,
            @RequestAttribute("userEmail") String email) {

        reminderService.deleteReminder(id, email);
    }
}