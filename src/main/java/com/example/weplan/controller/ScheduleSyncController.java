package com.example.weplan.controller;

import com.example.weplan.model.CalendarEvent;
import com.example.weplan.model.RegisteredUser;
import com.example.weplan.model.ScheduleSyncRequest;
import com.example.weplan.repository.CalendarEventRepository;
import com.example.weplan.repository.RegisteredUserRepository;
import com.example.weplan.repository.ScheduleSyncRequestRepository;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.HashSet;
import java.util.Set;
import java.util.LinkedHashMap;
import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/schedule-sync")
public class ScheduleSyncController {
    private final RegisteredUserRepository userRepository;
    private final ScheduleSyncRequestRepository requestRepository;
    private final CalendarEventRepository eventRepository;

    public ScheduleSyncController(RegisteredUserRepository userRepository,
                                  ScheduleSyncRequestRepository requestRepository,
                                  CalendarEventRepository eventRepository) {
        this.userRepository = userRepository;
        this.requestRepository = requestRepository;
        this.eventRepository = eventRepository;
    }

    @GetMapping("/users")
    public List<RegisteredUser> searchUsers(@RequestParam String query) {
        String value = query == null ? "" : query.trim();
        if (value.isEmpty()) return List.of();
        return userRepository.findTop20ByNicknameContainingIgnoreCaseOrIdContainingIgnoreCase(value, value);
    }

    @PostMapping("/users/register")
    public RegisteredUser registerCurrentUser(@RequestBody RegisteredUser user) {
        if (user.getId() == null || user.getId().isBlank()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST);
        return userRepository.save(user);
    }

    @PostMapping("/requests")
    public ScheduleSyncRequest createRequest(@RequestBody ScheduleSyncRequest request) {
        if (!userRepository.existsById(request.getTargetUserId())) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "가입된 사용자를 찾을 수 없습니다.");
        }
        ScheduleSyncRequest saved = ScheduleSyncRequest.builder()
                .id(UUID.randomUUID().toString())
                .managerUserId(request.getManagerUserId())
                .managerName(request.getManagerName())
                .targetUserId(request.getTargetUserId())
                .staffId(request.getStaffId())
                .staffName(request.getStaffName())
                .status("pending")
                .createdAt(Instant.now().toString())
                .build();
        return requestRepository.save(saved);
    }

    @GetMapping("/requests/incoming")
    public List<ScheduleSyncRequest> incoming(@RequestParam String userId) {
        return requestRepository.findByTargetUserIdOrderByCreatedAtDesc(userId);
    }

    @GetMapping("/requests/outgoing")
    public List<ScheduleSyncRequest> outgoing(@RequestParam String userId) {
        return requestRepository.findByManagerUserIdOrderByCreatedAtDesc(userId);
    }

    @PatchMapping("/requests/{id}")
    public ScheduleSyncRequest respond(@PathVariable String id, @RequestParam String userId, @RequestBody Map<String, String> body) {
        ScheduleSyncRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (!request.getTargetUserId().equals(userId)) throw new ResponseStatusException(HttpStatus.FORBIDDEN);
        String status = body.get("status");
        if (!"accepted".equals(status) && !"rejected".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "accepted 또는 rejected 상태가 필요합니다.");
        }
        request.setStatus(status);
        return requestRepository.save(request);
    }

    @PostMapping("/publish")
    @Transactional
    public List<CalendarEvent> publish(@RequestParam String managerUserId, @RequestParam String monthKey, @RequestBody List<CalendarEvent> events) {
        Map<String, ScheduleSyncRequest> latestRequests = new LinkedHashMap<>();
        requestRepository.findByManagerUserIdOrderByCreatedAtDesc(managerUserId).forEach(request ->
                latestRequests.putIfAbsent(request.getTargetUserId() + ":" + request.getStaffId(), request));
        List<ScheduleSyncRequest> acceptedRequests = latestRequests.values().stream()
                .filter(request -> "accepted".equals(request.getStatus())).toList();
        Set<String> ownersToRefresh = new HashSet<>();
        ownersToRefresh.add(managerUserId);
        latestRequests.values().forEach(request -> ownersToRefresh.add(request.getTargetUserId()));
        ownersToRefresh.forEach(ownerId -> eventRepository.deleteByOwnerUserIdAndScheduleManagerUserIdAndDateStartingWith(ownerId, managerUserId, monthKey));

        List<CalendarEvent> allowed = events.stream().filter(event -> {
            if (managerUserId.equals(event.getOwnerUserId())) return true;
            if (event.getOwnerUserId() == null || event.getScheduleStaffId() == null) return false;
            return acceptedRequests.stream()
                    .anyMatch(request -> request.getTargetUserId().equals(event.getOwnerUserId())
                            && request.getStaffId().equals(event.getScheduleStaffId())
                            && "accepted".equals(request.getStatus()));
        }).peek(event -> event.setScheduleManagerUserId(managerUserId)).toList();
        return eventRepository.saveAll(allowed);
    }
}
