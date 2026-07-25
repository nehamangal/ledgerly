package com.ledgerly.ledgerly.service;

import com.ledgerly.ledgerly.entity.Account;
import com.ledgerly.ledgerly.entity.Transaction;
import com.ledgerly.ledgerly.repository.AccountRepository;
import com.ledgerly.ledgerly.repository.TransactionRepository;

import org.springframework.stereotype.Service;

@Service
public class TransactionService {

    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;

    // 1. Constructor injection for your repositories
    public TransactionService(AccountRepository accountRepository, TransactionRepository transactionRepository) {
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
    }

    // 2. Pass the Transaction object into the method, not the repository
    public void processTransaction(Transaction request , String idempotencyKey) {
            //Idempotency check
            boolean isDuplicate = transactionRepository.existsByIdempotencyKey(idempotencyKey);

            if (isDuplicate) {
                throw new RuntimeException("Duplicate request detected: Please wait before sending the same amount to the same account.");
            }

            request.setIdempotencyKey(idempotencyKey);
            // 1. Fetch the FULL sender account from the database using the ID from the request
            Integer senderId = request.getFromAccount().getId();
            Account sender = accountRepository.findById(senderId)
                    .orElseThrow(() -> new RuntimeException("Sender account not found"));
            Integer amount = request.getAmount();

            // 2. Fetch the FULL receiver account from the database
            Integer receiverId = request.getToAccount().getId();
            Account receiver = accountRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver account not found"));

            // 3. Validate balance
            if (sender.getBalance() < request.getAmount()) {
                throw new RuntimeException("Insufficient balance");
            }
            
            // 4. Perform the calculation
            sender.setBalance(sender.getBalance() - amount);
            receiver.setBalance(receiver.getBalance() + amount);

            // 5. Save the updated accounts back to the database
            accountRepository.save(sender);
            accountRepository.save(receiver);

            // 6. Save the request itself
            transactionRepository.save(request);
    }
    
}