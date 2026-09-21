package com.lifeos.backend.service;

import com.lifeos.backend.DashboardResponse;
import com.lifeos.backend.model.Habit;
import com.lifeos.backend.model.Task;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.HabitRepository;
import com.lifeos.backend.repository.TaskRepository;
import com.lifeos.backend.repository.UserRepository;
import com.lifeos.backend.repository.NoteRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardService {

    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final NoteRepository noteRepository;
    private final HabitRepository habitRepository;

    public DashboardService(
            UserRepository userRepository,
            TaskRepository taskRepository,
            NoteRepository noteRepository,
            HabitRepository habitRepository) {

        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.noteRepository = noteRepository;
        this.habitRepository = habitRepository;
    }

    public DashboardResponse getDashboard(String loginIdentifier) {

        User user;

        // If JWT contains an email, find by email.
        // Otherwise, find by phone number.
        if (loginIdentifier != null && loginIdentifier.contains("@")) {

            user = userRepository.findByEmail(loginIdentifier)
                    .orElseThrow(() ->
                            new IllegalArgumentException("User not found"));

        } else {

            user = userRepository.findByPhone(loginIdentifier)
                    .orElseThrow(() ->
                            new IllegalArgumentException("User not found"));
        }

        List<Task> tasks = taskRepository.findByUser(user);

        /*
         * Completed tasks are removed from the task table.
         * Their count is permanently stored on the User.
         *
         * We also include any older completed tasks that may still
         * exist in the database, so existing data is not lost.
         */
        long completedTasks =
                user.getCompletedTaskCount()
                        + tasks.stream()
                        .filter(Task::isCompleted)
                        .count();

        long totalTasks =
                tasks.size()
                        + user.getCompletedTaskCount();

        long totalNotes = noteRepository.findByUser(user).size();

        List<Habit> habits = habitRepository.findByUser(user);

        LocalDate today = LocalDate.now();

        long completedHabitsToday = habits.stream()
                .filter(habit ->
                        today.equals(habit.getLastCompletedDate()))
                .count();

        int longestHabitStreak = habits.stream()
                .mapToInt(Habit::getBestStreak)
                .max()
                .orElse(0);

        return new DashboardResponse(
                totalTasks,
                completedTasks,
                totalNotes,
                habits.size(),
                completedHabitsToday,
                longestHabitStreak
        );
    }
}
