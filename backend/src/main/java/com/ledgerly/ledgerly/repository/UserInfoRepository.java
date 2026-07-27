package com.ledgerly.ledgerly.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ledgerly.ledgerly.entity.UserInfo;

public interface UserInfoRepository extends JpaRepository<UserInfo, Integer> {
    Optional<UserInfo> findByEmail(String email);
}