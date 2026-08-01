package com.ledgerly.ledgerly.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.ledgerly.ledgerly.entity.Account;
import com.ledgerly.ledgerly.entity.UserInfo;
import com.ledgerly.ledgerly.repository.AccountRepository;
import com.ledgerly.ledgerly.repository.UserInfoRepository;

@Service
public class AccountService {
    
    private final AccountRepository accountRepository;
    private final UserInfoRepository userInfoRepository;

    public AccountService(AccountRepository accountRepository, UserInfoRepository userInfoRepository){
        this.accountRepository = accountRepository;
        this.userInfoRepository = userInfoRepository;
    }

    public void createAccount(String email, Account account){
        Account existAccount = accountRepository.findByName(account.getName());
        
        if(existAccount != null){
            throw new RuntimeException("Account with this name already exists");
        }
        
        // This MUST be safely tucked inside the method body like this:
        account.setUser(userInfoRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email)));
        
        int balance = account.getBalance();
        String accountName = account.getName();
        String currency = account.getCurrency();
        String bankName = account.getBankName();

        account.setCurrency(currency);
        account.setBalance(balance);
        account.setName(accountName);
        account.setBankName(bankName);

        accountRepository.save(account);
    }

    public List<Account> fetchAllAccounts(String email){
        List<Account> accounts = accountRepository.findByUserEmail(email);
        
        if(accounts == null){
            throw new RuntimeException("No Account Found!!.");
        }
        return accounts;
    }

    public List<Account> fetchAllUsersAccounts(){
        List<Account> accounts = accountRepository.findAll();
        
        if(accounts == null){
            throw new RuntimeException("No Account Found!!.");
        }
        return accounts;
    }

    public Integer getAccountBalance(String accountName){
        Account account = accountRepository.findByName(accountName);

        if(account == null){
            throw new RuntimeException("Account not found with name: " + accountName);
        }
        return account.getBalance();
    }
}