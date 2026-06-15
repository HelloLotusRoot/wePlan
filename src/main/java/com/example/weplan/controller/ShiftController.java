package com.example.weplan.controller;

import com.example.weplan.model.Shift;
import com.example.weplan.repository.ShiftRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shifts")
public class ShiftController {

    @Autowired
    private ShiftRepository repository;

    @GetMapping
    public List<Shift> getShifts() {
        List<Shift> shifts = repository.findAll();
        if (shifts.isEmpty()) {
            // Seed a default shift if empty
            Shift defaultShift = Shift.builder()
                    .id("day")
                    .label("근무")
                    .start("09:00")
                    .end("18:00")
                    .color("#16a34a")
                    .build();
            repository.save(defaultShift);
            shifts.add(defaultShift);
        }
        return shifts;
    }

    @PostMapping
    public List<Shift> saveShifts(@RequestBody List<Shift> shifts) {
        repository.deleteAll();
        return repository.saveAll(shifts);
    }
}
