package com.lifeos.backend;

public class DashboardResponse {

    private long totalTasks;
    private long completedTasks;

    private long totalNotes;

    private long totalHabits;
    private long completedHabitsToday;
    private int longestHabitStreak;

    public DashboardResponse() {
    }

    public DashboardResponse(
            long totalTasks,
            long completedTasks,
            long totalNotes,
            long totalHabits,
            long completedHabitsToday,
            int longestHabitStreak) {

        this.totalTasks = totalTasks;
        this.completedTasks = completedTasks;
        this.totalNotes = totalNotes;
        this.totalHabits = totalHabits;
        this.completedHabitsToday = completedHabitsToday;
        this.longestHabitStreak = longestHabitStreak;
    }

    public long getTotalTasks() {
        return totalTasks;
    }

    public long getCompletedTasks() {
        return completedTasks;
    }

    public long getTotalNotes() {
        return totalNotes;
    }

    public long getTotalHabits() {
        return totalHabits;
    }

    public long getCompletedHabitsToday() {
        return completedHabitsToday;
    }

    public int getLongestHabitStreak() {
        return longestHabitStreak;
    }
}