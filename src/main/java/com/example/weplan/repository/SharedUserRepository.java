package com.example.weplan.repository;

import com.example.weplan.model.SharedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SharedUserRepository extends JpaRepository<SharedUser, String> {
}
