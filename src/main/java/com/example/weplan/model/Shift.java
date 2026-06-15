package com.example.weplan.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "shifts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {
    @Id
    private String id; // e.g. "day", "eve", "night", or a custom timestamp ID
    
    private String label;
    private String start;
    
    @Column(name = "shift_end")
    private String end;
    
    private String color;
}
