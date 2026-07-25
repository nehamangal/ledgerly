package com.ledgerly.ledgerly.repository;

import com.ledgerly.ledgerly.entity.UserInfo;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserInfoRepository extends JpaRepository<UserInfo, Integer> {
    Optional<UserInfo> findByEmail(String email);
}