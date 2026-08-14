CREATE DATABASE IF NOT EXISTS weplan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE weplan;

CREATE TABLE IF NOT EXISTS user_settings (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    user_name VARCHAR(100),
    user_job VARCHAR(100),
    is_private_mode TINYINT(1) DEFAULT 0,
    enable_event_alarm TINYINT(1) DEFAULT 0,
    event_alarm_time VARCHAR(10),
    enable_repeat_alarm TINYINT(1) DEFAULT 0,
    exclude_holidays TINYINT(1) DEFAULT 0,
    show_korean_holidays TINYINT(1) DEFAULT 1,
    show_alternative_holidays TINYINT(1) DEFAULT 1,
    show_lunar_anniversaries TINYINT(1) DEFAULT 1,
    show_my_anniversaries TINYINT(1) DEFAULT 1,
    work_view_mode VARCHAR(20) DEFAULT 'badge',
    apt_view_mode VARCHAR(20) DEFAULT 'dot'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shifts (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    label VARCHAR(50),
    start VARCHAR(10),
    shift_end VARCHAR(10),
    color VARCHAR(30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    type VARCHAR(30),
    date VARCHAR(10),
    shift_type VARCHAR(50),
    title VARCHAR(300),
    time VARCHAR(10),
    place VARCHAR(300),
    is_private TINYINT(1) DEFAULT 0,
    participants_json TEXT,
    start_date VARCHAR(10),
    end_date VARCHAR(10),
    color VARCHAR(30),
    name VARCHAR(100),
    is_lunar TINYINT(1) DEFAULT 0,
    alarm_on_day TINYINT(1) DEFAULT 0,
    alarm_week_before TINYINT(1) DEFAULT 0,
    repeat_yearly TINYINT(1) DEFAULT 1,
    alarm_enabled TINYINT(1) DEFAULT 1,
    alarm_time VARCHAR(30),
    alarm_date_time VARCHAR(30),
    share_scope VARCHAR(20) DEFAULT 'public',
    share_permission VARCHAR(20) DEFAULT 'view',
    display_mode VARCHAR(20) DEFAULT 'dot',
    shared_with TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS shared_users (
    id VARCHAR(100) NOT NULL PRIMARY KEY,
    name VARCHAR(100),
    relation VARCHAR(200),
    privilege VARCHAR(20) DEFAULT 'read',
    avatar VARCHAR(255),
    is_sharing TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS memos (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    date VARCHAR(10),
    title VARCHAR(255),
    category VARCHAR(100),
    emoji VARCHAR(20),
    content TEXT,
    created_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS todos (
    id VARCHAR(50) NOT NULL PRIMARY KEY,
    text VARCHAR(255) NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    date VARCHAR(10),
    created_at VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SHOW TABLES;
