package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reward_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RewardLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private int userId;

    @Column(name = "transaction_id", nullable = false, unique = true)
    private String transactionId;

    @Column(name = "points_earned", nullable = false)
    private int pointsEarned;

    @Column(name = "created_on", nullable = false)
    private LocalDateTime createdOn;

    @PrePersist
    protected void onCreate() {
        if (this.createdOn == null) {
            this.createdOn = LocalDateTime.now();
        }
    }
}