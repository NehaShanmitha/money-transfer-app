package com.example.demo.service;

import com.example.demo.dto.TransferRequest;
import com.example.demo.dto.TransferResponse;
import com.example.demo.entity.Account;
import com.example.demo.entity.TransactionLog;
import com.example.demo.enums.TransactionStatus;
import com.example.demo.exception.*;
import com.example.demo.repository.AccountRepo;
import com.example.demo.repository.TransactionLogRepo;
import com.example.demo.service.RewardService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;


@Service
@RequiredArgsConstructor
public class TransferServiceImpl implements TransferService {

    private static final Logger logger = org.slf4j.LoggerFactory.getLogger("transfer-service");

    private final AccountRepo accountRepo;
    private final TransactionLogRepo transactionRepo;
    private final RewardService rewardService;

    @Override
    @Transactional(noRollbackFor = {InsufficientBalanceException.class, AccountNotFoundException.class})
    public TransferResponse transfer(TransferRequest request) {
        String transactionId = "TRX-" + UUID.randomUUID();

        try {
            validateTransfer(request);

            checkIdempotency(request.getIdempotencyKey());

            return executeTransfer(request, transactionId);

        } catch (AccountNotFoundException | AccessDeniedException | DuplicateTransferException ex) {
            throw ex;
        } catch (Exception ex) {
            try {
                TransactionLog log = new TransactionLog();
                log.setId(transactionId);
                log.setFromAccountId(request.getFromAccountId());
                log.setToAccountId(request.getToAccountId());
                log.setAmount(request.getAmount());
                log.setStatus(TransactionStatus.FAILED);
                log.setFailureReason(ex.getMessage());
                log.setIdempotencyKey(request.getIdempotencyKey());

                transactionRepo.save(log);

                logger.info("Failed transaction logged: {}", transactionId);
            } catch (Exception new_ex) {
                logger.error("Failed to log transaction failure", new_ex);
            }
            throw ex;
        }
    }

    private void validateTransfer(TransferRequest request) {
        logger.debug("Validating transfer request");

        if (request.getFromAccountId().equals(request.getToAccountId())) {
            throw new IllegalArgumentException(
                    "Source and destination accounts must be different"
            );
        }

        if (request.getAmount().signum() <= 0) {
            throw new IllegalArgumentException("Transfer amount must be positive");
        }

        Account from = accountRepo.findById(request.getFromAccountId())
                .orElseThrow(() -> new AccountNotFoundException(request.getFromAccountId()));

        String currentUsername = SecurityContextHolder.getContext().getAuthentication().getName();
        if (!from.getOwner().getUsername().equals(currentUsername)) {
            throw new AccessDeniedException("You are not authorized to transfer from this account.");
        }

        logger.debug("Validation passed");
    }

    private void checkIdempotency(String idempotencyKey) {
        logger.debug("Checking idempotency for key: {}", idempotencyKey);

        transactionRepo.findByIdempotencyKey(idempotencyKey)
                .ifPresent(existingTx -> {
                    logger.warn("Duplicate transfer detected with key: {}", idempotencyKey);
                    throw new DuplicateTransferException(idempotencyKey);
                });

        logger.debug("Idempotency check passed");
    }

    private TransferResponse executeTransfer(TransferRequest request, String transactionId) {
        logger.debug("Executing transfer with locks");

        Long firstLockId = Math.min(request.getFromAccountId(), request.getToAccountId());
        Long secondLockId = Math.max(request.getFromAccountId(), request.getToAccountId());

        Account firstAccount = accountRepo.findByIdWithLock(firstLockId)
                .orElseThrow(() -> new AccountNotFoundException(firstLockId));

        Account secondAccount = accountRepo.findByIdWithLock(secondLockId)
                .orElseThrow(() -> new AccountNotFoundException(secondLockId));

        Account fromAccount = firstLockId.equals(request.getFromAccountId())
                ? firstAccount : secondAccount;
        Account toAccount = firstLockId.equals(request.getToAccountId())
                ? firstAccount : secondAccount;

        logger.info("Locks acquired for accounts {} and {}",
                fromAccount.getId(), toAccount.getId());

        fromAccount.debit(request.getAmount());
        logger.debug("Debited {} from account {}", request.getAmount(), fromAccount.getId());

        toAccount.credit(request.getAmount());
        logger.debug("Credited {} to account {}", request.getAmount(), toAccount.getId());

        accountRepo.save(fromAccount);
        accountRepo.save(toAccount);

        TransactionLog transactionLog = new TransactionLog();
        transactionLog.setId(transactionId);
        transactionLog.setFromAccountId(request.getFromAccountId());
        transactionLog.setToAccountId(request.getToAccountId());
        transactionLog.setAmount(request.getAmount());
        transactionLog.setStatus(TransactionStatus.SUCCESS);
        transactionLog.setIdempotencyKey(request.getIdempotencyKey());
        transactionRepo.save(transactionLog);

        int pointsEarned = 0;
        try {
            pointsEarned = rewardService.processRewardForTransaction(transactionLog);
        } catch (Exception ex) {
            // Reward failure must NEVER affect the transfer outcome
            logger.error("Reward processing failed for transaction {}: {}",
                    transactionLog.getId(), ex.getMessage());
        }

        logger.info("Transfer completed successfully: {}", transactionLog.getId());
        TransferResponse transferResponse = new TransferResponse();
        transferResponse.setId(transactionLog.getId());
        transferResponse.setStatus(TransactionStatus.SUCCESS);
        transferResponse.setMessage("Transfer completed successfully");
        transferResponse.setFromAccountId(request.getFromAccountId());
        transferResponse.setToAccountId(request.getToAccountId());
        transferResponse.setAmount(request.getAmount());
        transferResponse.setPointsEarned(pointsEarned);
        return transferResponse;
    }
}