package com.example.weplan.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSetting {
    @Id
    private String id; // "default"
    
    private String userName;
    private String userJob;
    private boolean isPrivateMode;
    
    // Alarm settings
    private boolean enableEventAlarm;
    private String eventAlarmTime;
    private boolean enableRepeatAlarm;
    private boolean excludeHolidays;
    
    // Display settings
    private boolean showKoreanHolidays;
    private boolean showAlternativeHolidays;
    private boolean showLunarAnniversaries;
    private boolean showMyAnniversaries;
    
    // View representation modes
    private String workViewMode; // 'full' or 'badge'
    private String aptViewMode;  // 'dot' or 'box'
}
