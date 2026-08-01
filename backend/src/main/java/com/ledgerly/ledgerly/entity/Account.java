package com.ledgerly.ledgerly.entity;

import java.util.UUID; // Import UUID

import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist; // Import PrePersist
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Account {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // 1. Change type from Integer to String to hold UUID text
    @Column(name = "account_id", unique = true, updatable = false)
    private String accountId;

    @Column(name = "name")   
    private String name;

    @Column(name="bank_name")
    private String bankName;

    @Column(name="currency")
    private String currency = "INR";

    @Column(name = "balance")
    private Integer balance;

    //Many account belong to one user
    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="user_id" , nullable=false)
    @JsonIgnore
    private UserInfo user;

    // 2. Automatically generate a UUID right before the account is saved to the database
    @PrePersist
    public void generateAccountID() {
        if (this.accountId == null) {
            this.accountId = UUID.randomUUID().toString();
        }
    }
}