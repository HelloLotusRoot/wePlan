package com.example.weplan.controller;

import com.example.weplan.model.Todo;
import com.example.weplan.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    @Autowired
    private TodoRepository todoRepository;

    @GetMapping
    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    @PostMapping
    public List<Todo> saveAllTodos(@RequestBody List<Todo> todos) {
        todoRepository.deleteAll();
        return todoRepository.saveAll(todos);
    }

    @PostMapping("/single")
    public Todo saveSingleTodo(@RequestBody Todo todo) {
        return todoRepository.save(todo);
    }

    @DeleteMapping("/{id}")
    public void deleteTodo(@PathVariable String id) {
        todoRepository.deleteById(id);
    }
}
