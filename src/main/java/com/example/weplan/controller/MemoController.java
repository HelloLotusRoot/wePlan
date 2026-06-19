package com.example.weplan.controller;

import com.example.weplan.model.Memo;
import com.example.weplan.repository.MemoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/memos")
public class MemoController {

    @Autowired
    private MemoRepository repository;

    @GetMapping
    public List<Memo> getMemos() {
        return repository.findAll();
    }

    @PostMapping
    public List<Memo> saveMemos(@RequestBody List<Memo> memos) {
        repository.deleteAll();
        return repository.saveAll(memos);
    }

    @PostMapping("/single")
    public Memo saveSingleMemo(@RequestBody Memo memo) {
        return repository.save(memo);
    }

    @DeleteMapping("/{id}")
    public void deleteMemo(@PathVariable String id) {
        repository.deleteById(id);
    }
}
