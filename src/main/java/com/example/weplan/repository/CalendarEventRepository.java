package com.example.weplan.repository;

import com.example.weplan.model.CalendarEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CalendarEventRepository extends JpaRepository<CalendarEvent, String> {
    List<CalendarEvent> findByOwnerUserId(String ownerUserId);
    void deleteByOwnerUserId(String ownerUserId);
    void deleteByOwnerUserIdAndScheduleManagerUserIdAndDateStartingWith(String ownerUserId, String scheduleManagerUserId, String datePrefix);
}
