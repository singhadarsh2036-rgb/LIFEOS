package com.lifeos.backend.service;

import com.lifeos.backend.model.Task;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.TaskRepository;
import com.lifeos.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository) {

        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    // Finds the user whether they logged in using email OR phone
    private User findUser(String loginIdentifier) {

        if (loginIdentifier != null &&
                loginIdentifier.contains("@")) {

            return userRepository.findByEmail(loginIdentifier)
                    .orElseThrow(() ->
                            new IllegalArgumentException("User not found"));

        } else {

            return userRepository.findByPhone(loginIdentifier)
                    .orElseThrow(() ->
                            new IllegalArgumentException("User not found"));
        }
    }

    public List<Task> getAllTasks(String loginIdentifier) {

        User user = findUser(loginIdentifier);

        return taskRepository.findByUser(user);
    }

    public Task createTask(Task task, String loginIdentifier) {

        if (task.getTitle() == null ||
                task.getTitle().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Task title cannot be empty");
        }

        User user = findUser(loginIdentifier);

        task.setUser(user);

        return taskRepository.save(task);
    }

    public Task updateTask(
            Long id,
            Task task,
            String loginIdentifier) {

        User user = findUser(loginIdentifier);

        Task existingTask = taskRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Task not found"));

        if (!existingTask.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot modify another user's task");
        }

        if (task.getTitle() == null ||
                task.getTitle().trim().isEmpty()) {

            throw new IllegalArgumentException(
                    "Task title cannot be empty");
        }

        /*
         * When a task is marked completed:
         * 1. Increase the user's permanent completed-task count.
         * 2. Delete the completed task.
         *
         * The count is saved on User, so deleting the task
         * does not remove the progress from the dashboard.
         */
        if (task.isCompleted()) {

            if (!existingTask.isCompleted()) {
                user.setCompletedTaskCount(
                        user.getCompletedTaskCount() + 1
                );

                userRepository.save(user);
            }

            taskRepository.delete(existingTask);

            return existingTask;
        }

        existingTask.setTitle(task.getTitle());
        existingTask.setCompleted(false);

        return taskRepository.save(existingTask);
    }

    public void deleteTask(
            Long id,
            String loginIdentifier) {

        User user = findUser(loginIdentifier);

        Task task = taskRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Task not found"));

        if (!task.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot delete another user's task");
        }

        taskRepository.deleteById(id);
    }
}
