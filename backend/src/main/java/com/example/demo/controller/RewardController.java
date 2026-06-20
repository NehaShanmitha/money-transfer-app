package com.example.demo.controller;

import com.example.demo.dto.RewardResponse;
import com.example.demo.entity.User;
import com.example.demo.repository.UserRepo;
import com.example.demo.service.RewardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;
    private final UserRepo userRepo;

    /**
     * GET /api/rewards/my-points
     * Returns total reward points for the authenticated user.
     */
    @GetMapping("/my-points")
    public ResponseEntity<Map<String, Integer>> getMyPoints() {
        int userId = getAuthenticatedUserId();
        int total = rewardService.getTotalPointsForUser(userId);
        return ResponseEntity.ok(Map.of("totalPoints", total));
    }

    /**
     * GET /api/rewards/my-history
     * Returns the full reward history for the authenticated user.
     */
    @GetMapping("/my-history")
    public ResponseEntity<List<RewardResponse>> getMyHistory() {
        int userId = getAuthenticatedUserId();
        List<RewardResponse> history = rewardService.getRewardsForUser(userId);
        return ResponseEntity.ok(history);
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    private int getAuthenticatedUserId() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
        return user.getId();
    }
}