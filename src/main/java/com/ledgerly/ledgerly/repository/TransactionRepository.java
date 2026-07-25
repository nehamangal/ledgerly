package com.ledgerly.ledgerly.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ledgerly.ledgerly.entity.Transaction;


public interface TransactionRepository extends JpaRepository<Transaction, Integer>  {
    boolean existsByIdempotencyKey(String idempotencyKey);
}
