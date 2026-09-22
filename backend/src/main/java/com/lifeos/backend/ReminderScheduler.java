package com.lifeos.backend.service;

import com.lifeos.backend.model.Reminder;
import com.lifeos.backend.model.PushSubscription;
import com.lifeos.backend.repository.ReminderRepository;
import com.lifeos.backend.repository.PushSubscriptionRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Random;

@Service
public class ReminderScheduler {

    private final ReminderRepository reminderRepository;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final PushNotificationService pushNotificationService;

    private final Random random = new Random();

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

        LocalDateTime now =
                LocalDateTime.now(ZoneId.of("Asia/Kolkata"));

        List<Reminder> reminders =
                reminderRepository
                        .findByCompletedFalseAndNotificationSentFalseAndReminderTimeLessThanEqual(now);

        for (Reminder reminder : reminders) {

            try {

                List<PushSubscription> subscriptions =
                        pushSubscriptionRepository
                                .findByUser(reminder.getUser());

                NotificationMessage message =
                        createNotification(reminder.getTitle());

                for (PushSubscription subscription : subscriptions) {

                    pushNotificationService.sendNotification(
                            subscription.getEndpoint(),
                            subscription.getP256dh(),
                            subscription.getAuth(),
                            message.title,
                            message.body
                    );
                }

                reminderRepository.delete(reminder);

                System.out.println(
                        "✅ LIFEOS notification sent & reminder deleted: "
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

    private NotificationMessage createNotification(String reminder) {

        String text = reminder.toLowerCase();

        // 🏋️ GYM / FITNESS
        if (containsAny(text,
                "gym", "workout", "exercise", "fitness", "chest",
                "back", "legs", "shoulder", "biceps", "triceps")) {

            String[] messages = {
                    "Your muscles have been waiting. Sadly, they're not coming to you. 💀",
                    "No excuses bro. Gravity isn't going to lift the weights for you. 🏋️",
                    "Gym time. Your future physique has entered the chat. 👀",
                    "You paid for the gym. Might as well visit it. 😭",
                    "Character development starts now. 💪"
            };

            return randomMessage("LIFEOS has entered the gym 🏋️", messages);
        }

        // 💻 DSA / CODING
        if (containsAny(text,
                "dsa", "leetcode", "code", "coding", "programming",
                "java", "algorithm", "development", "developer")) {

            String[] messages = {
                    "LeetCode is waiting to humble you again. 😭",
                    "That bug isn't going to fix itself, bro. 💀",
                    "Future you will thank you for coding now. Probably. 👀",
                    "One more problem. Then you can pretend you're a genius. 😭",
                    "Your IDE misses you. Open it. 💻"
            };

            return randomMessage("LIFEOS.exe has entered the chat 💻", messages);
        }

        // 📚 STUDY
        if (containsAny(text,
                "study", "read", "revision", "exam", "class",
                "college", "learn", "course", "subject")) {

            String[] messages = {
                    "Your syllabus isn't getting smaller by itself. 😭",
                    "Academic comeback loading... 📚🔥",
                    "Bro, future you has an exam and is already stressed. 💀",
                    "Time to make those brain cells earn their salary. 🧠",
                    "Open the books. Netflix can survive without you. 😭"
            };

            return randomMessage("Bro, it's study time. 📚", messages);
        }

        // 💊 MEDICINE / HEALTH
        if (containsAny(text,
                "medicine", "tablet", "med", "doctor", "hospital",
                "health", "vitamin", "pill")) {

            String[] messages = {
                    "Your body has submitted a reminder. Please cooperate. 💊😂",
                    "Bro, this one is actually important. Take your medicine. 💊",
                    "Your future self would like you to take this. ❤️",
                    "Health doesn't have a snooze button. 😭💊",
                    "Time to keep the human machine running. 🫡"
            };

            return randomMessage("LIFEOS Health Check 💊", messages);
        }

        // 🍕 FOOD
        if (containsAny(text,
                "lunch", "dinner", "breakfast", "eat", "food",
                "meal", "snack", "restaurant")) {

            String[] messages = {
                    "Dear human, your stomach has filed a complaint. 🍽️",
                    "Bro, even your stomach is getting impatient. 😭",
                    "Fuel the machine. Then we continue the chaos. 🍕",
                    "Food.exe needs to be executed. 😂",
                    "Your stomach would like to have a word with you. 👀"
            };

            return randomMessage("LIFEOS Kitchen Department 🍽️", messages);
        }

        // 😴 SLEEP
        if (containsAny(text,
                "sleep", "bed", "nap", "rest", "wake up")) {

            String[] messages = {
                    "Bro, even your phone is tired of you. Go sleep. 😭🌙",
                    "Your bed has been waiting patiently. 🛏️",
                    "Enough scrolling. Tomorrow has plans for you. 😭",
                    "Sleep now. Regret less tomorrow. 🌙",
                    "Even your brain needs a software update. 😴"
            };

            return randomMessage("LIFEOS Sleep Department 🌙", messages);
        }

        // ❤️ LOVE / RELATIONSHIP
        if (containsAny(text,
                "love", "girlfriend", "boyfriend", "crush",
                "date", "anniversary", "relationship",
                "wife", "husband", "her", "him")) {

            String[] messages = {
                    "Bro… have you checked on your favourite human today? 👀❤️",
                    "Don't fumble this one. 😭❤️",
                    "Someone might be waiting for your message. 👀",
                    "Put the ego aside. Go talk to them. ❤️",
                    "Your love life just sent a notification. 😂❤️",
                    "This might be more important than your DSA streak. 💀❤️"
            };

            return randomMessage("LIFEOS Relationship Department ❤️", messages);
        }

        // 📞 CALL / PEOPLE
        if (containsAny(text,
                "call", "phone", "contact", "talk", "meet",
                "mom", "dad", "friend", "family")) {

            String[] messages = {
                    "Bro… call them. You know you were supposed to. 😭📞",
                    "Someone deserves a call from you today. ❤️",
                    "Your contacts are starting to feel ignored. 💀",
                    "Pick up the phone. No, Instagram doesn't count. 😭",
                    "Human interaction loading... 📞😂"
            };

            return randomMessage("LIFEOS Social Department 📞", messages);
        }

        // ✈️ TRAVEL
        if (containsAny(text,
                "flight", "travel", "trip", "airport", "train",
                "bus", "hotel", "journey", "vacation")) {

            String[] messages = {
                    "You're not in a movie. The flight WILL leave without you. ✈️💀",
                    "Passport? Tickets? Brain? Check everything. 😂✈️",
                    "Adventure loading... don't miss the transport. 😭",
                    "Time to move, traveller. 🌍✈️",
                    "The airport has absolutely no sympathy for you. 💀"
            };

            return randomMessage("LIFEOS Travel Control ✈️", messages);
        }

        // 💼 WORK
        if (containsAny(text,
                "work", "office", "project", "meeting", "job",
                "task", "client", "deadline")) {

            String[] messages = {
                    "Netflix can wait. Your task cannot. 😭",
                    "Future you is already angry at present you. 💀",
                    "One task. One mission. Don't overthink it. 🫡",
                    "Your productivity arc starts now. 🔥",
                    "That task has been staring at you long enough. 👀"
            };

            return randomMessage("LIFEOS Work Mode 💼", messages);
        }

        // 💰 MONEY / BILLS
        if (containsAny(text,
                "money", "bill", "emi", "payment", "rent",
                "salary", "finance", "bank", "loan")) {

            String[] messages = {
                    "Your wallet would like a serious conversation. 💸😭",
                    "Money doesn't manage itself, unfortunately. 💀",
                    "Time to handle the financial boss fight. 💰",
                    "Future you says: please don't forget this. 😭",
                    "Bills have entered the chat. 💸"
            };

            return randomMessage("LIFEOS Finance Mode 💰", messages);
        }

        // 🛒 SHOPPING
        if (containsAny(text,
                "shopping", "buy", "purchase", "order",
                "amazon", "flipkart", "groceries")) {

            String[] messages = {
                    "Do you need it or do you just WANT it? 👀💸",
                    "Your cart is calling. 😂🛒",
                    "Before you buy it... think twice. Your wallet is watching. 💀",
                    "Shopping mission activated. 🛒",
                    "Remember: sale doesn't automatically mean necessary. 😭"
            };

            return randomMessage("LIFEOS Shopping Mode 🛒", messages);
        }

        // 🏃 RUNNING
        if (containsAny(text,
                "run", "running", "jog", "walk", "steps")) {

            String[] messages = {
                    "Those legs aren't going to move themselves. 🏃😂",
                    "Time to outrun your excuses. 💀",
                    "One step at a time, bro. Literally. 🏃",
                    "Your cardio arc starts now. 🔥",
                    "Go touch some grass. Literally. 🌱😂"
            };

            return randomMessage("LIFEOS Running Mode 🏃", messages);
        }

        // 💧 WATER
        if (containsAny(text,
                "water", "drink water", "hydrate", "hydration")) {

            String[] messages = {
                    "Your body is approximately 70% water. Act accordingly. 💧😂",
                    "Hydration check, bro. 💧",
                    "Drink water before your body starts sending angry emails. 😭",
                    "Water.exe needs to run. 💧",
                    "Hydrate. Your organs have standards. 😂"
            };

            return randomMessage("LIFEOS Hydration Check 💧", messages);
        }

        // 🎂 BIRTHDAY
        if (containsAny(text,
                "birthday", "bday", "birth day")) {

            String[] messages = {
                    "Someone's birthday is coming. Don't become the person who forgets. 💀🎂",
                    "Birthday alert! Time to pretend you remembered naturally. 😂🎂",
                    "Cake, wishes and absolutely no excuses. 🎂❤️",
                    "Important human birthday detected. Act accordingly. 👀🎂"
            };

            return randomMessage("LIFEOS Birthday Department 🎂", messages);
        }

        // 🧹 HOME / CHORES
        if (containsAny(text,
                "clean", "cleaning", "laundry", "room",
                "dishes", "wash", "home", "chores")) {

            String[] messages = {
                    "Your room isn't going to clean itself, bro. 😭",
                    "Character development: cleaning your own mess. 💀",
                    "Your future self would appreciate a clean room. 🧹",
                    "Time to defeat the laundry boss. 😂",
                    "The mess has become sentient. Please intervene. 💀"
            };

            return randomMessage("LIFEOS Home Mode 🏠", messages);
        }

        // 📄 DOCUMENTS
        if (containsAny(text,
                "document", "aadhaar", "passport", "license",
                "voter", "certificate", "renewal", "registration")) {

            String[] messages = {
                    "Future you will be very happy you handled this now. 📄",
                    "Paperwork boss fight starts now. 💀",
                    "Don't let one expired document ruin your day. 😭",
                    "Administrative business awaits. 🫡📄"
            };

            return randomMessage("LIFEOS Admin Department 📄", messages);
        }

        // 🧠 SELF IMPROVEMENT
        if (containsAny(text,
                "habit", "goal", "improve", "practice",
                "learn", "meditate", "journal")) {

            String[] messages = {
                    "Tiny progress is still progress. Keep going. 🧠🔥",
                    "Your future self is watching. Make them proud. 👀",
                    "Another day, another upgrade. 🚀",
                    "Consistency > motivation. You know the drill. 💪",
                    "Character development continues... 🎬"
            };

            return randomMessage("LIFEOS Character Development 🧠", messages);
        }

        // 🎯 GENERIC
        String[] messages = {
                "Remember that thing you said you'd definitely do? Yeah... this is that thing. 👀",
                "Bro, it's time. No further questions. 😭",
                "You put this reminder here for a reason. 👀",
                "Future you is counting on present you. 🫡",
                "The notification has spoken. 😂",
                "One small task. Let's get it done. 🔥",
                "LIFEOS knows what you promised yourself. 👀",
                "Your reminder has arrived. Your excuses have not been invited. 💀"
        };

        return randomMessage("LIFEOS has entered the chat 👀", messages);
    }

    private boolean containsAny(String text, String... keywords) {

        for (String keyword : keywords) {

            if (text.contains(keyword)) {
                return true;
            }
        }

        return false;
    }

    private NotificationMessage randomMessage(
            String title,
            String[] messages) {

        String body =
                messages[random.nextInt(messages.length)];

        return new NotificationMessage(title, body);
    }

    private static class NotificationMessage {

        String title;
        String body;

        NotificationMessage(
                String title,
                String body) {

            this.title = title;
            this.body = body;
        }
    }
}