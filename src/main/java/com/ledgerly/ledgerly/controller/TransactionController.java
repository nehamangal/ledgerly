package com.ledgerly.ledgerly.controller;
import com.ledgerly.ledgerly.entity.Transaction;
import com.ledgerly.ledgerly.service.TransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    
    @Autowired
    private TransactionService transactionService;


    @PostMapping
    public ResponseEntity<String> createTransaction(@RequestHeader("X-Idempotency-Key") String idempotencyKey ,@RequestBody Transaction transaction){
        try{
            transactionService.processTransaction(transaction , idempotencyKey);
            return new ResponseEntity<>("Transction Created Sucessfully!!" , HttpStatus.CREATED);
        } catch(RuntimeException e){
            return new ResponseEntity<>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }
}
