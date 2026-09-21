package com.lifeos.backend.service;

import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.Security;

import org.bouncycastle.jce.provider.BouncyCastleProvider;

@Service
public class PushNotificationService {

    @Value("${lifeos.vapid.public-key}")
    private String vapidPublicKey;

    @Value("${lifeos.vapid.private-key}")
    private String vapidPrivateKey;

    public void sendNotification(
            String endpoint,
            String p256dh,
            String auth,
            String title,
            String body
    ) throws Exception {

        Security.addProvider(new BouncyCastleProvider());

        PushService pushService = new PushService(
                vapidPublicKey,
                vapidPrivateKey,
                "mailto:singhadarsh2036@gmail.com"
        );

        String payload = """
                {
                    "title": "%s",
                    "body": "%s",
                    "url": "/reminders"
                }
                """.formatted(title, body);

        Notification notification = new Notification(
                endpoint,
                p256dh,
                auth,
                payload
        );

        var response = pushService.send(notification);

        System.out.println(
                "🔔 PUSH RESPONSE: "
                + response.getStatusLine().getStatusCode()
                + " "
                + response.getStatusLine().getReasonPhrase()
        );
    }
}