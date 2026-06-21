package com.example.demo.service;

import com.example.demo.dto.RewardResponse;
import com.example.demo.entity.TransactionLog;

import java.util.List;

public interface RewardService {

    /**
     * Evaluates a completed transaction for reward eligibility
     * and persists a RewardLog if eligible.
     * Called after a successful transfer.
     */
    int processRewardForTransaction(TransactionLog transactionLog);

    /**
     * Returns all reward entries for the given user.
     */
    List<RewardResponse> getRewardsForUser(int userId);

    /**
     * Returns total accumulated points for the given user.
     */
    int getTotalPointsForUser(int userId);
}