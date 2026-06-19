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
@Table(name = "memos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Memo {
    @Id
    private String id;
    
    private String date; // YYYY-MM-DD
    private String title;
    private String category;
    private String emoji;
    
    @Column(columnDefinition = "TEXT")
    private String content;
    
    private String createdAt;
}
