package com.lifeos.backend.repository;

import com.lifeos.backend.model.Note;
import com.lifeos.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {

    List<Note> findByUser(User user);
}
