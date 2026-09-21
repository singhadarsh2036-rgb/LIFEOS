package com.lifeos.backend;

import com.lifeos.backend.model.Habit;
import com.lifeos.backend.service.HabitService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/habits")
public class HabitController {

    private final HabitService habitService;

    public HabitController(HabitService habitService) {
        this.habitService = habitService;
    }

    @GetMapping
    public List<Habit> getAllHabits(
            @RequestAttribute("userEmail") String email) {

        return habitService.getAllHabits(email);
    }

    @PostMapping
    public ResponseEntity<Habit> createHabit(
            @Valid @RequestBody Habit habit,
            @RequestAttribute("userEmail") String email) {

        Habit createdHabit = habitService.createHabit(habit, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdHabit);
    }

    @PutMapping("/{id}")
    public Habit updateHabit(
            @PathVariable Long id,
            @Valid @RequestBody Habit habit,
            @RequestAttribute("userEmail") String email) {

        return habitService.updateHabit(id, habit, email);
    }

    @PostMapping("/{id}/complete")
    public Habit completeHabit(
            @PathVariable Long id,
            @RequestAttribute("userEmail") String email) {

        return habitService.completeHabit(id, email);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteHabit(
            @PathVariable Long id,
            @RequestAttribute("userEmail") String email) {

        habitService.deleteHabit(id, email);
    }
}