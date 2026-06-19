package com.example.weplan.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "todos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Todo {
    @Id
    private String id;
    private String text;
    private boolean completed;
    private String date; // YYYY-MM-DD, nullable/empty for general todos
    private String createdAt;
}
