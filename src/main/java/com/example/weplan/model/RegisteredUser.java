package com.example.weplan.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "registered_users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisteredUser {
    @Id
    private String id;
    private String nickname;
    private String profileImage;
}
