package com.lifeos.backend.service;

import com.lifeos.backend.model.Note;
import com.lifeos.backend.model.User;
import com.lifeos.backend.repository.NoteRepository;
import com.lifeos.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NoteService {

    private final NoteRepository noteRepository;
    private final UserRepository userRepository;

    public NoteService(
            NoteRepository noteRepository,
            UserRepository userRepository) {

        this.noteRepository = noteRepository;
        this.userRepository = userRepository;
    }

    public List<Note> getAllNotes(String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        return noteRepository.findByUser(user);
    }

    public Note createNote(Note note, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        note.setUser(user);

        return noteRepository.save(note);
    }

    public Note updateNote(
            Long id,
            Note note,
            String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        Note existingNote = noteRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Note not found"));

        if (!existingNote.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot modify another user's note");
        }

        existingNote.setTitle(note.getTitle());
        existingNote.setContent(note.getContent());

        return noteRepository.save(existingNote);
    }

    public void deleteNote(Long id, String email) {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new IllegalArgumentException("User not found"));

        Note note = noteRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Note not found"));

        if (!note.getUser().getId()
                .equals(user.getId())) {

            throw new IllegalArgumentException(
                    "You cannot delete another user's note");
        }

        noteRepository.deleteById(id);
    }
}
