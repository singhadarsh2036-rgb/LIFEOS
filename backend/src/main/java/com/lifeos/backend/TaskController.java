package com.lifeos.backend;

import com.lifeos.backend.model.Task;
import com.lifeos.backend.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public List<Task> getAllTasks(
            @RequestAttribute("userEmail") String email) {

        return taskService.getAllTasks(email);
    }

    @PostMapping
    public ResponseEntity<Task> createTask(
            @Valid @RequestBody Task task,
            @RequestAttribute("userEmail") String email) {

        Task createdTask = taskService.createTask(task, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdTask);
    }

    @PutMapping("/{id}")
    public Task updateTask(
            @PathVariable Long id,
            @Valid @RequestBody Task task,
            @RequestAttribute("userEmail") String email) {

        return taskService.updateTask(id, task, email);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(
            @PathVariable Long id,
            @RequestAttribute("userEmail") String email) {

        taskService.deleteTask(id, email);
    }
}