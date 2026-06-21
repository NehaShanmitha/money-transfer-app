package com.example.demo.dto;

import com.example.demo.enums.TransactionStatus;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransferResponse {
    private String id;

    private Long fromAccountId;

    private Long toAccountId;

    private BigDecimal amount;

    private TransactionStatus status;

    private String message;

    private int pointsEarned;

}
