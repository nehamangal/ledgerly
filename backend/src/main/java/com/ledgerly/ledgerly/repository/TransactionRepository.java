package com.ledgerly.ledgerly.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import com.ledgerly.ledgerly.entity.Transaction;


public interface TransactionRepository extends JpaRepository<Transaction, Integer>  {
    boolean existsByIdempotencyKey(String idempotencyKey);

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccount.id = :accountId OR t.toAccount.id = :accountId) " +
           "AND (t.fromAccount.user.email = :email OR t.toAccount.user.email = :email)")
    List<Transaction> findTransactionsByUserEmailAndAccountId(
            @Param("email") String email,
            @Param("accountId") Integer accountId
    );
}
