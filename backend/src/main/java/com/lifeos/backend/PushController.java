package com.lifeos.backend;

import com.lifeos.backend.model.PushSubscription;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.PushSubscriptionRepository;
import com.lifeos.backend.repository.UserRepository;
import com.lifeos.backend.service.PushNotificationService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/push")
public class PushController {

    private final PushSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final PushNotificationService pushNotificationService;

    @Value("${lifeos.vapid.public-key}")
    private String vapidPublicKey;

    public PushController(
            PushSubscriptionRepository subscriptionRepository,
            UserRepository userRepository,
            PushNotificationService pushNotificationService) {

        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
        this.pushNotificationService = pushNotificationService;
    }

    @GetMapping("/public-key")
    public ResponseEntity<String> getPublicKey() {
        return ResponseEntity.ok(vapidPublicKey);
    }

    @PostMapping("/subscribe")
    public ResponseEntity<String> subscribe(
            @RequestBody PushSubscriptionRequest request,
            @RequestAttribute("userEmail") String loginIdentifier) {

        User user = findUser(loginIdentifier);

        PushSubscription subscription =
                subscriptionRepository
                        .findByEndpoint(request.getEndpoint())
                        .orElse(new PushSubscription());

        subscription.setEndpoint(request.getEndpoint());
        subscription.setP256dh(request.getKeys().getP256dh());
        subscription.setAuth(request.getKeys().getAuth());
        subscription.setUser(user);

        subscriptionRepository.save(subscription);

        System.out.println(
                "🔔 Push subscription saved for user: "
                        + loginIdentifier
        );

        return ResponseEntity.ok("Push subscription saved");
    }

    @PostMapping("/test")
    public ResponseEntity<String> testPush(
            @RequestAttribute("userEmail") String loginIdentifier)
            throws Exception {

        User user = findUser(loginIdentifier);

        List<PushSubscription> subscriptions =
                subscriptionRepository.findByUser(user);

        for (PushSubscription subscription : subscriptions) {

            pushNotificationService.sendNotification(
                    subscription.getEndpoint(),
                    subscription.getP256dh(),
                    subscription.getAuth(),
                    "LIFEOS 🔔",
                    "Push notifications are working!"
            );
        }

        return ResponseEntity.ok("Test notification sent");
    }

    // ==============================
    // FIND USER BY EMAIL OR PHONE
    // ==============================

    private User findUser(String loginIdentifier) {

        if (loginIdentifier != null &&
                loginIdentifier.contains("@")) {

            return userRepository
                    .findByEmail(loginIdentifier)
                    .orElseThrow(() ->
                            new IllegalArgumentException(
                                    "User not found"));
        }

        return userRepository
                .findByPhone(loginIdentifier)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "User not found"));
    }
}