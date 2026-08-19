package com.example.weplan.controller;

import com.example.weplan.model.CalendarEvent;
import com.example.weplan.repository.CalendarEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import jakarta.transaction.Transactional;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private CalendarEventRepository repository;

    @GetMapping
    public List<CalendarEvent> getEvents(@RequestParam(required = false) String userId) {
        List<CalendarEvent> events = userId == null || userId.isBlank() ? repository.findAll() : repository.findByOwnerUserId(userId);
        if (events.isEmpty() && (userId == null || userId.isBlank())) {
            // Seed initial mock events to match initial React state
            List<CalendarEvent> seed = new ArrayList<>();
            
            // Shifts
            seed.add(CalendarEvent.builder().id("shift-1").type("shift").shiftType("day").date("2024-05-01").build());
            seed.add(CalendarEvent.builder().id("shift-2").type("shift").shiftType("day").date("2024-05-03").build());
            seed.add(CalendarEvent.builder().id("shift-3").type("shift").shiftType("day").date("2024-05-06").build());
            seed.add(CalendarEvent.builder().id("shift-4").type("shift").shiftType("day").date("2024-05-08").build());
            seed.add(CalendarEvent.builder().id("shift-5").type("shift").shiftType("day").date("2024-05-10").build());
            seed.add(CalendarEvent.builder().id("shift-6").type("shift").shiftType("day").date("2024-05-15").build());
            seed.add(CalendarEvent.builder().id("shift-7").type("shift").shiftType("day").date("2024-05-17").build());
            seed.add(CalendarEvent.builder().id("shift-8").type("shift").shiftType("day").date("2024-05-20").build());
            seed.add(CalendarEvent.builder().id("shift-9").type("shift").shiftType("day").date("2024-05-27").build());
            seed.add(CalendarEvent.builder().id("shift-10").type("shift").shiftType("day").date("2024-05-30").build());

            // Appointments
            seed.add(CalendarEvent.builder().id("apt-1").type("appointment").title("친구 생일").date("2024-05-03").time("18:00").place("패밀리 레스토랑").build());
            seed.add(CalendarEvent.builder().id("apt-2").type("appointment").title("영화 약속").date("2024-05-09").time("19:30").place("CGV 강남").build());
            seed.add(CalendarEvent.builder().id("apt-3").type("appointment").title("친구랑 점심").date("2024-05-15").time("12:30").place("강남역 맛집")
                    .participantsJson("[{\"name\":\"나\",\"avatar\":\"https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=80&auto=format&fit=crop\"},{\"name\":\"민지\",\"avatar\":\"https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80&auto=format&fit=crop\"},{\"name\":\"재윤\",\"avatar\":\"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=80&auto=format&fit=crop\"}]")
                    .build());
            seed.add(CalendarEvent.builder().id("apt-4").type("appointment").title("헬스").date("2024-05-15").time("18:00").place("스포애니").build());
            seed.add(CalendarEvent.builder().id("apt-5").type("appointment").title("병원 교육").date("2024-05-13").time("14:00").place("세미나실").build());
            seed.add(CalendarEvent.builder().id("apt-6").type("appointment").title("카페 약속").date("2024-05-18").time("15:00").place("스타벅스").build());

            // Trips
            seed.add(CalendarEvent.builder().id("trip-1").type("trip").title("여행 (2박 3일)").startDate("2024-05-23").endDate("2024-05-25").place("제주도").color("blue").build());

            // Birthdays
            seed.add(CalendarEvent.builder().id("bday-1").type("birthday").name("나의 생일").date("2024-05-22").isLunar(true).alarmOnDay(true).alarmWeekBefore(true).build());
            seed.add(CalendarEvent.builder().id("bday-2").type("birthday").name("부모님 생신").date("2024-05-28").isLunar(true).alarmOnDay(true).alarmWeekBefore(false).build());

            repository.saveAll(seed);
            events.addAll(seed);
        }
        return events;
    }

    @PostMapping
    @Transactional
    public List<CalendarEvent> saveEvents(@RequestBody List<CalendarEvent> events, @RequestParam(required = false) String userId) {
        if (userId == null || userId.isBlank()) repository.deleteAll();
        else {
            repository.deleteByOwnerUserId(userId);
            events.forEach(event -> event.setOwnerUserId(userId));
        }
        return repository.saveAll(events);
    }

    @PostMapping("/single")
    public CalendarEvent saveSingleEvent(@RequestBody CalendarEvent event, @RequestParam(required = false) String userId) {
        if (userId != null && !userId.isBlank()) event.setOwnerUserId(userId);
        return repository.save(event);
    }

    @DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable String id) {
        repository.deleteById(id);
    }
}
