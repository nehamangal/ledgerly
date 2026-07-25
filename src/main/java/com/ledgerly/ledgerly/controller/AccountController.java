package com.ledgerly.ledgerly.controller;
import com.ledgerly.ledgerly.entity.Account;
import com.ledgerly.ledgerly.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account")
public class AccountController {
    @Autowired
    private AccountService accountService;

    @PostMapping
    public ResponseEntity<String> createAccount(@RequestBody Account  account){
        try{
            accountService.createAccount(account);
            return new ResponseEntity<String>("Successfully Acount is Created!!.", HttpStatus.CREATED);
        } catch(RuntimeException  e){
            return new ResponseEntity<String>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/amount")
    public ResponseEntity<String> fetchAmount(@RequestParam String accountName){
        try{
            Integer amount = accountService.getAccountBalance(accountName);
            String response = "Account: " + accountName + ", Balance: " + amount;
            return new ResponseEntity<>(response , HttpStatus.OK);
        } catch(RuntimeException e){
            return new ResponseEntity<>(e.getMessage() , HttpStatus.BAD_REQUEST); 
        }
    }


}
