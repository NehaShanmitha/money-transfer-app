package com.example.demo.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardResponse {
    private Long id;
    private String transactionId;
    private int pointsEarned;
    private LocalDateTime createdOn;
}