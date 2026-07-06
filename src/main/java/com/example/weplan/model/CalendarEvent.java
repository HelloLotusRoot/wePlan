package com.example.weplan.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.FetchType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Entity
@Table(name = "calendar_events")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CalendarEvent {
    @Id
    private String id;
    
    private String type; // "shift", "appointment", "trip", "birthday"
    private String date; // "YYYY-MM-DD"
    
    // Shift-specific fields
    private String shiftType; // e.g. "day", "eve", "night"
    private Boolean isManagerScheduled;
    private String staffName;
    private String label;
    
    // Appointment / Trip specific fields
    private String title;
    private String time;
    private String place;
    private Boolean isPrivate;
    
    @Column(length = 2000)
    private String participantsJson; // JSON representation of participants
    
    // Trip-specific fields
    private String startDate; // "YYYY-MM-DD"
    private String endDate;   // "YYYY-MM-DD"
    private String color;     // e.g. "blue", "green"
    
    // Birthday-specific fields
    private String name;
    private Boolean isLunar;
    private Boolean alarmOnDay;
    private Boolean alarmWeekBefore;
    
    // Sharing fields
    private String shareScope; // "public", "private", "custom"
    
    private String displayMode; // "dot" or "box"
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "calendar_event_sharing_friends", joinColumns = @JoinColumn(name = "event_id"))
    @Column(name = "friend_id")
    private List<String> sharedWith;
}
