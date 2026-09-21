package com.lifeos.backend;

import com.lifeos.backend.model.Note;
import com.lifeos.backend.service.NoteService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public List<Note> getAllNotes(
            @RequestAttribute("userEmail") String email) {

        return noteService.getAllNotes(email);
    }

    @PostMapping
    public ResponseEntity<Note> createNote(
            @Valid @RequestBody Note note,
            @RequestAttribute("userEmail") String email) {

        Note createdNote = noteService.createNote(note, email);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(createdNote);
    }

    @PutMapping("/{id}")
    public Note updateNote(
            @PathVariable Long id,
            @Valid @RequestBody Note note,
            @RequestAttribute("userEmail") String email) {

        return noteService.updateNote(id, note, email);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(
            @PathVariable Long id,
            @RequestAttribute("userEmail") String email) {

        noteService.deleteNote(id, email);
    }
}