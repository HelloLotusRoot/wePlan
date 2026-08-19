package com.example.weplan.repository;

import com.example.weplan.model.RegisteredUser;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RegisteredUserRepository extends JpaRepository<RegisteredUser, String> {
    List<RegisteredUser> findTop20ByNicknameContainingIgnoreCaseOrIdContainingIgnoreCase(String nickname, String id);
}
