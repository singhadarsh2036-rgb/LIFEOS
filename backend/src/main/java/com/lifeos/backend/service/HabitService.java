package com.lifeos.backend.service;

import com.lifeos.backend.model.Habit;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.HabitRepository;
import com.lifeos.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final UserRepository userRepository;

    public HabitService(
            HabitRepository habitRepository,
            UserRepository userRepository) {

        this.habitRepository = habitRepository;
        this.userRepository = userRepository;
    }

    public List<Habit> getAllHabits(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        List<Habit> habits = habitRepository.findByUser(user);

        LocalDate today = LocalDate.now();

        for (Habit habit : habits) {

            if (habit.getLastCompletedDate() == null
                    || !habit.getLastCompletedDate().equals(today)) {

                habit.setCompletedToday(false);
            }
        }

        return habits;
    }

    public Habit createHabit(Habit habit, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        habit.setUser(user);
        habit.setCompletedToday(false);
        habit.setStreak(0);
        habit.setBestStreak(0);
        habit.setLastCompletedDate(null);

        return habitRepository.save(habit);
    }

    public Habit updateHabit(
            Long id,
            Habit habit,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        Habit existingHabit = habitRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Habit not found"));

        if (!existingHabit.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot modify another user's habit");
        }

        existingHabit.setName(habit.getName());

        return habitRepository.save(existingHabit);
    }

    public Habit completeHabit(Long id, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        Habit habit = habitRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Habit not found"));

        if (!habit.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot complete another user's habit");
        }

        LocalDate today = LocalDate.now();
        LocalDate lastCompleted = habit.getLastCompletedDate();

        // Already completed today
        if (today.equals(lastCompleted)) {
            return habit;
        }

        // Continue yesterday's streak
        if (lastCompleted != null
                && lastCompleted.equals(today.minusDays(1))) {

            habit.setStreak(habit.getStreak() + 1);

        } else {
            // First completion or streak was broken
            habit.setStreak(1);
        }

        // Update best streak
        if (habit.getStreak() > habit.getBestStreak()) {
            habit.setBestStreak(habit.getStreak());
        }

        habit.setCompletedToday(true);
        habit.setLastCompletedDate(today);

        return habitRepository.save(habit);
    }

    public void deleteHabit(Long id, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        Habit habit = habitRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Habit not found"));

        if (!habit.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot delete another user's habit");
        }

        habitRepository.deleteById(id);
    }
}