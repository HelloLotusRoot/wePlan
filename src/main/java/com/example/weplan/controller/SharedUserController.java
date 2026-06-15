package com.example.weplan.controller;

import com.example.weplan.model.SharedUser;
import com.example.weplan.repository.SharedUserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/shared-users")
public class SharedUserController {

    @Autowired
    private SharedUserRepository repository;

    @GetMapping
    public List<SharedUser> getSharedUsers() {
        List<SharedUser> users = repository.findAll();
        if (users.isEmpty()) {
            // Seed default mockup shared users
            List<SharedUser> seed = new ArrayList<>();
            seed.add(SharedUser.builder()
                    .id("user-1")
                    .name("민지")
                    .relation("연인 ❤️")
                    .privilege("보기 가능")
                    .avatar("https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=80&auto=format&fit=crop")
                    .isSharing(true)
                    .build());
            seed.add(SharedUser.builder()
                    .id("user-2")
                    .name("가족")
                    .relation("가족 🏠")
                    .privilege("편집 가능")
                    .avatar("https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=80&auto=format&fit=crop")
                    .isSharing(true)
                    .build());
            seed.add(SharedUser.builder()
                    .id("user-3")
                    .name("현지")
                    .relation("친구 👭")
                    .privilege("보기 가능")
                    .avatar("https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=80&auto=format&fit=crop")
                    .isSharing(true)
                    .build());
            
            repository.saveAll(seed);
            users.addAll(seed);
        }
        return users;
    }

    @PostMapping
    public List<SharedUser> saveSharedUsers(@RequestBody List<SharedUser> users) {
        repository.deleteAll();
        return repository.saveAll(users);
    }
}
