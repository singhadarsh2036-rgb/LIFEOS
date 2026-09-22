package com.lifeos.backend.service;

import com.lifeos.backend.model.PushSubscription;
import com.lifeos.backend.model.Reminder;
import com.lifeos.backend.repository.PushSubscriptionRepository;
import com.lifeos.backend.repository.ReminderRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReminderScheduler {

    private final ReminderRepository reminderRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushNotificationService pushNotificationService;

    public ReminderScheduler(
            ReminderRepository reminderRepository,
            PushSubscriptionRepository pushSubscriptionRepository,
            PushNotificationService pushNotificationService) {

        this.reminderRepository = reminderRepository;
        this.pushSubscriptionRepository = pushSubscriptionRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @Scheduled(fixedRate = 15000)
    public void checkReminders() {

        LocalDateTime now = LocalDateTime.now();

        List<Reminder> reminders =
                reminderRepository
                        .findByCompletedFalseAndNotificationSentFalseAndReminderTimeLessThanEqual(now);

        for (Reminder reminder : reminders) {

            try {

                List<PushSubscription> subscriptions =
                        pushSubscriptionRepository.findByUser(
                                reminder.getUser()
                        );

                String title = "🔔 LIFEOS Reminder";

                String body =
                        "⏰ " + reminder.getTitle();

                for (PushSubscription subscription : subscriptions) {

                    pushNotificationService.sendNotification(
                            subscription.getEndpoint(),
                            subscription.getP256dh(),
                            subscription.getAuth(),
                            title,
                            body
                    );
                }

                reminder.setNotificationSent(true);
                reminder.setCompleted(true);

                reminderRepository.save(reminder);

                System.out.println(
                        "✅ Reminder notification sent: "
                                + reminder.getTitle()
                );

            } catch (Exception e) {

                System.out.println(
                        "❌ Failed to send reminder: "
                                + reminder.getTitle()
                );

                e.printStackTrace();
            }
        }
    }
}