package com.lifeos.backend.repository;

import com.lifeos.backend.model.Habit;
import com.lifeos.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HabitRepository extends JpaRepository<Habit, Long> {

    List<Habit> findByUser(User user);
}