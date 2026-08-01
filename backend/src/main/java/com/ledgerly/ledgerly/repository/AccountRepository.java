package com.ledgerly.ledgerly.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import com.ledgerly.ledgerly.entity.Account;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account , Integer>{
    Account findByName(String name);
    Optional<Account> findByNameAndUserEmail(String name, String email);
    Optional<Account> findByIdAndUserEmail(Integer id, String email);
    // List<Account> searchAccounts(@Param("query") String query);
    List<Account> findByUserEmail(String email);
}
