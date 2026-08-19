package com.example.weplan.repository;

import com.example.weplan.model.ScheduleSyncRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ScheduleSyncRequestRepository extends JpaRepository<ScheduleSyncRequest, String> {
    List<ScheduleSyncRequest> findByTargetUserIdOrderByCreatedAtDesc(String targetUserId);
    List<ScheduleSyncRequest> findByManagerUserIdOrderByCreatedAtDesc(String managerUserId);
    Optional<ScheduleSyncRequest> findFirstByManagerUserIdAndTargetUserIdAndStaffIdOrderByCreatedAtDesc(String managerUserId, String targetUserId, String staffId);
}
