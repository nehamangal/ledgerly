package com.ledgerly.ledgerly.service;
import com.ledgerly.ledgerly.entity.Account;
import com.ledgerly.ledgerly.repository.AccountRepository;
import org.springframework.stereotype.Service;

@Service
public class AccountService {
    
    private final AccountRepository accountRepository;

    public AccountService(AccountRepository accountRepository){
        this.accountRepository = accountRepository;
    }

    public void createAccount(Account account){
        int balance = account.getBalance();
        String accountName = account.getName();
        
        account.setBalance(balance);
        account.setName(accountName);

        accountRepository.save(account);
    }

    public Integer getAccountBalance(String accountName){
            Account account = accountRepository.findByName(accountName);

            if(account==null){
                throw new RuntimeException("Account not found with name: " + accountName);
            }
            return account.getBalance();
    }
}
