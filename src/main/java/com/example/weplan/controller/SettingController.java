package com.example.weplan.controller;

import com.example.weplan.model.UserSetting;
import com.example.weplan.repository.UserSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
public class SettingController {

    @Autowired
    private UserSettingRepository repository;

    @GetMapping
    public UserSetting getSettings() {
        return repository.findById("default").orElseGet(() -> {
            UserSetting defaultSettings = UserSetting.builder()
                    .id("default")
                    .userName("김소현")
                    .userJob("간호사")
                    .isPrivateMode(false)
                    .enableEventAlarm(true)
                    .eventAlarmTime("전날 18:00")
                    .enableRepeatAlarm(true)
                    .excludeHolidays(true)
                    .showHolidayCalendar(true)
                    .showKoreanHolidays(true)
                    .showAlternativeHolidays(true)
                    .showLunarAnniversaries(true)
                    .showMyAnniversaries(true)
                    .workViewMode("badge")
                    .aptViewMode("dot")
                    .build();
            return repository.save(defaultSettings);
        });
    }

}
