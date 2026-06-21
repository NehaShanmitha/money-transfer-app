package com.example.demo.service;

import com.example.demo.dto.RewardResponse;
import com.example.demo.entity.Account;
import com.example.demo.entity.RewardLog;
import com.example.demo.entity.TransactionLog;
import com.example.demo.enums.TransactionStatus;
import com.example.demo.repository.AccountRepo;
import com.example.demo.repository.RewardLogRepo;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RewardServiceImpl implements RewardService {

    private static final Logger logger = LoggerFactory.getLogger(RewardServiceImpl.class);
    private static final BigDecimal REWARD_THRESHOLD = new BigDecimal("100");
    private static final BigDecimal POINTS_PER_UNIT  = new BigDecimal("100");

    private final RewardLogRepo rewardLogRepo;
    private final AccountRepo accountRepo;

    @Override
    @Transactional
    public int processRewardForTransaction(TransactionLog transactionLog) {
        // ── Rule 1: Transaction must be SUCCESS ──────────────────────────────
        if (transactionLog.getStatus() != TransactionStatus.SUCCESS) {
                logger.debug("Reward skipped — transaction {} is not SUCCESS", transactionLog.getId());
                return 0;
        }

        // ── Rule 2: Amount must be greater than 100 ──────────────────────────
        if (transactionLog.getAmount().compareTo(REWARD_THRESHOLD) <= 0) {
                logger.debug("Reward skipped — amount {} is not > 100 for transaction {}",
                        transactionLog.getAmount(), transactionLog.getId());
                return 0;
        }

        // ── Rules 3 & 4: Sender and receiver must be different users ─────────
        Account fromAccount = accountRepo.findById(transactionLog.getFromAccountId())
                .orElse(null);
        Account toAccount = accountRepo.findById(transactionLog.getToAccountId())
                .orElse(null);

        if (fromAccount == null || toAccount == null) {
                logger.warn("Reward skipped — could not load accounts for transaction {}",
                        transactionLog.getId());
                return 0;
        }

        if (fromAccount.getOwner().getId() == toAccount.getOwner().getId()) {
                logger.debug("Reward skipped — self-transfer detected for transaction {}",
                        transactionLog.getId());
                return 0;
        }

        // ── Calculate points: floor(amount / 100) ───────────────────────────
        int points = transactionLog.getAmount()
                .divideToIntegralValue(POINTS_PER_UNIT)
                .intValue();

        if (points <= 0) {
                logger.debug("Reward skipped — calculated 0 points for transaction {}",
                        transactionLog.getId());
                return 0;
        }

        // ── Persist the reward ───────────────────────────────────────────────
        RewardLog rewardLog = new RewardLog();
        rewardLog.setUserId(fromAccount.getOwner().getId());
        rewardLog.setTransactionId(transactionLog.getId());
        rewardLog.setPointsEarned(points);

        rewardLogRepo.save(rewardLog);

        logger.info("Reward granted — {} points to user {} for transaction {}",
                points, fromAccount.getOwner().getId(), transactionLog.getId());

        return points;
    }

    @Override
    public List<RewardResponse> getRewardsForUser(int userId) {
        return rewardLogRepo.findByUserIdOrderByCreatedOnDesc(userId)
                .stream()
                .map(log -> RewardResponse.builder()
                        .id(log.getId())
                        .transactionId(log.getTransactionId())
                        .pointsEarned(log.getPointsEarned())
                        .createdOn(log.getCreatedOn())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public int getTotalPointsForUser(int userId) {
        return rewardLogRepo.sumPointsByUserId(userId);
    }
}