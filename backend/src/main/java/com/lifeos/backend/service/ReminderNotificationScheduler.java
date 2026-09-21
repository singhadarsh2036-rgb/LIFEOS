package com.lifeos.backend.service;

import com.lifeos.backend.model.PushSubscription;
import com.lifeos.backend.model.Reminder;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.PushSubscriptionRepository;
import com.lifeos.backend.repository.ReminderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderNotificationScheduler {

    private final ReminderRepository reminderRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushNotificationService pushNotificationService;

    public ReminderNotificationScheduler(
            ReminderRepository reminderRepository,
            PushSubscriptionRepository pushSubscriptionRepository,
            PushNotificationService pushNotificationService) {

        this.reminderRepository = reminderRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Scheduled(fixedRate = 10000)
    public void checkReminders() {

        LocalDateTime now = LocalDateTime.now();

        List<Reminder> dueReminders =
                reminderRepository
                        .findByCompletedFalseAndNotificationSentFalseAndReminderTimeLessThanEqual(now);

        for (Reminder reminder : dueReminders) {

            User user = reminder.getUser();

            if (user == null) {
                continue;
            }

            List<PushSubscription> subscriptions =
                    pushSubscriptionRepository.findByUser(user);

            boolean notificationSent = false;

            for (PushSubscription subscription : subscriptions) {

                try {

                    pushNotificationService.sendNotification(
                            subscription.getEndpoint(),
                            subscription.getP256dh(),
                            subscription.getAuth(),
                            "LIFEOS 🔔",
                            reminder.getTitle()
                    );

                    notificationSent = true;

                    System.out.println(
                            "🔔 Reminder notification sent: "
                                    + reminder.getTitle()
                    );

                } catch (Exception e) {

                    System.out.println(
                            "❌ Failed to send reminder notification: "
                                    + e.getMessage()
                    );
                }
            }

            if (notificationSent) {

                reminder.setNotificationSent(true);

                // Notification successfully sent → remove reminder
                reminderRepository.delete(reminder);

                System.out.println(
                        "✅ Reminder notification sent and reminder removed: "
                                + reminder.getTitle()
                );
            }
        }
    }
}