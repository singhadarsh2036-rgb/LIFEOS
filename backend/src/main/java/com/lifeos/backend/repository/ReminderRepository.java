package com.lifeos.backend.repository;

import com.lifeos.backend.model.Reminder;
import com.lifeos.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByUser(User user);

    List<Reminder> findByCompletedFalseAndNotificationSentFalseAndReminderTimeLessThanEqual(
            LocalDateTime time
    );
}