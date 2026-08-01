package com.ledgerly.ledgerly.controller;
import java.security.Principal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ledgerly.ledgerly.entity.Transaction;
import com.ledgerly.ledgerly.service.TransactionService;

import io.jsonwebtoken.ExpiredJwtException;

@RestController
@RequestMapping("/api")
public class TransactionController {
    
    @Autowired
    private TransactionService transactionService;


    @PostMapping("/transactions")
    public ResponseEntity<String> createTransaction(@RequestHeader("X-Idempotency-Key") String idempotencyKey ,@RequestBody Transaction transaction){
        try{
            transactionService.processTransaction(transaction , idempotencyKey);
            return new ResponseEntity<>("Transction Created Sucessfully!!" , HttpStatus.CREATED);
        } catch (ExpiredJwtException e) {
            return new ResponseEntity<>("Token expired", HttpStatus.UNAUTHORIZED);
        }catch(RuntimeException e){
                    return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
            }
    }


    @GetMapping("/transactions")
    public ResponseEntity<?> fetchTransaction(Principal principle, @RequestParam Integer accountId) {
        try {
            String email = principle.getName();
            List<Transaction> transactions = transactionService.fetchUserTransaction(email, accountId);
            return ResponseEntity.ok(transactions);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("An error occurred while fetching transactions: " + e.getMessage());
        }
    }
}
