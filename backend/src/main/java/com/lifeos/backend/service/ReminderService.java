package com.lifeos.backend.service;

import com.lifeos.backend.model.Reminder;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.ReminderRepository;
import com.lifeos.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    public ReminderService(
            ReminderRepository reminderRepository,
            UserRepository userRepository) {

        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
    }

    // ================================
    // FIND USER BY EMAIL OR PHONE
    // ================================

    private User findUser(String loginIdentifier) {

        if (loginIdentifier != null &&
                loginIdentifier.contains("@")) {

            return userRepository.findByEmail(loginIdentifier)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "User not found"));
        }

        return userRepository.findByPhone(loginIdentifier)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"));
    }

    // ================================
    // GET ALL REMINDERS
    // ================================

    public List<Reminder> getAllReminders(
            String loginIdentifier) {

        User user = findUser(loginIdentifier);

        return reminderRepository.findByUser(user);
    }

    // ================================
    // CREATE REMINDER
    // ================================

    public Reminder createReminder(
            Reminder reminder,
            String loginIdentifier) {

        if (reminder.getTitle() == null ||
                reminder.getTitle().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Reminder title cannot be empty");
        }

        if (reminder.getReminderTime() == null) {

            throw new IllegalArgumentException(
                    "Reminder time is required");
        }

        User user = findUser(loginIdentifier);

        reminder.setUser(user);
        reminder.setCompleted(false);

        // New reminder = notification has not been sent yet
        reminder.setNotificationSent(false);

        return reminderRepository.save(reminder);
    }

    // ================================
    // UPDATE REMINDER
    // ================================

    public Reminder updateReminder(
            Long id,
            Reminder reminder,
            String loginIdentifier) {

        User user = findUser(loginIdentifier);

        Reminder existingReminder =
                reminderRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Reminder not found"));

        if (!existingReminder.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot modify another user's reminder");
        }

        if (reminder.getTitle() == null ||
                reminder.getTitle().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Reminder title cannot be empty");
        }

        if (reminder.getReminderTime() == null) {

            throw new IllegalArgumentException(
                    "Reminder time is required");
        }

        existingReminder.setTitle(
                reminder.getTitle());

        existingReminder.setReminderTime(
                reminder.getReminderTime());

        existingReminder.setCompleted(
                reminder.isCompleted());

        // Reset notification when reminder is updated
        existingReminder.setNotificationSent(false);

        return reminderRepository.save(
                existingReminder);
    }

    // ================================
    // DELETE REMINDER
    // ================================

    public void deleteReminder(
            Long id,
            String loginIdentifier) {

        User user = findUser(loginIdentifier);

        Reminder reminder =
                reminderRepository.findById(id)
                        .orElseThrow(() ->
                                new IllegalArgumentException(
                                        "Reminder not found"));

        if (!reminder.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot delete another user's reminder");
        }

        reminderRepository.deleteById(id);
    }
}