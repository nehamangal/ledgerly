package com.ledgerly.ledgerly.controller;
import com.ledgerly.ledgerly.entity.Account;
import com.ledgerly.ledgerly.service.AccountService;

import io.jsonwebtoken.ExpiredJwtException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.*;

@RestController
@RequestMapping("/api")
public class AccountController {
    @Autowired
    private AccountService accountService;


    @PostMapping("/account")
    public ResponseEntity<String> createAccount(@RequestBody Account  account , Principal principal){
        try{
            String email = principal.getName();
            accountService.createAccount(email , account);
            return new ResponseEntity<String>("Successfully Acount is Created!!.", HttpStatus.CREATED);
        } catch (ExpiredJwtException e) {
            return new ResponseEntity<>("Token expired", HttpStatus.UNAUTHORIZED);
        }catch(RuntimeException  e){
            return new ResponseEntity<String>(e.getMessage(), HttpStatus.BAD_REQUEST);
        }
    }

    @GetMapping("/accounts")
    public ResponseEntity<Object> getAccounts(Principal principal) {
        try{
            String email = principal.getName();
            List<Account> accounts = accountService.fetchAllAccounts(email);
            return ResponseEntity.ok(accounts);
        } catch (ExpiredJwtException e) {
            return new ResponseEntity<>("Token expired", HttpStatus.UNAUTHORIZED);
        }catch(RuntimeException e){
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }

    @GetMapping("/allUserAccounts")
    public ResponseEntity<Object> getAllUsersAccounts() {
        try{
            List<Account> accounts = accountService.fetchAllUsersAccounts();
            return ResponseEntity.ok(accounts);
        } catch (ExpiredJwtException e) {
            return new ResponseEntity<>("Token expired", HttpStatus.UNAUTHORIZED);
        }catch(RuntimeException e){
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    

    @GetMapping("/amount")
    public ResponseEntity<String> fetchAmount(@RequestParam String accountName){
        try{
            Integer amount = accountService.getAccountBalance(accountName);
            String response = "Account: " + accountName + ", Balance: " + amount;
            return new ResponseEntity<>(response , HttpStatus.OK);
        } catch (ExpiredJwtException e) {
            return new ResponseEntity<>("Token expired", HttpStatus.UNAUTHORIZED);
        }catch(RuntimeException e){
            return new ResponseEntity<>(e.getMessage() , HttpStatus.BAD_REQUEST); 
        }
    }


}
