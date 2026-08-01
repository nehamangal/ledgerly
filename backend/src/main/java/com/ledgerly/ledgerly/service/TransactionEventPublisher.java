package com.ledgerly.ledgerly.service;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.ledgerly.ledgerly.entity.Transaction;

@Service
public class TransactionEventPublisher {
    private final RabbitTemplate rabbitTemplate;
    
    @Value("${app.exchange.transaction}")
    private String exchange;

    @Value("${app.routing.key.transaction}")
    private String routingKey;

    public TransactionEventPublisher(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void publishTransactionCreated(Transaction transaction){
        rabbitTemplate.convertAndSend(exchange, routingKey, transaction);
    }
}
