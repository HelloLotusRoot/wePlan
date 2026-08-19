package com.example.weplan.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "schedule_sync_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScheduleSyncRequest {
    @Id
    private String id;
    private String managerUserId;
    private String managerName;
    private String targetUserId;
    private String staffId;
    private String staffName;
    private String status;
    private String createdAt;
}
