package com.example.weplan.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "shared_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SharedUser {
    @Id
    private String id;
    
    private String name;
    private String relation;
    private String privilege;
    private String avatar;
    private boolean isSharing;
}
