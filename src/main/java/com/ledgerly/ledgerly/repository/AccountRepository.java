package com.ledgerly.ledgerly.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import com.ledgerly.ledgerly.entity.Account;

public interface AccountRepository extends JpaRepository<Account , Integer>{
    Account findByName(String name);
}
