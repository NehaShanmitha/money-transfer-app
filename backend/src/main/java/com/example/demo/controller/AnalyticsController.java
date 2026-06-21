package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import java.sql.*;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:4200")
public class AnalyticsController {

    private final String snowflakeUrl =
        "jdbc:snowflake://pyfxlle-cgc84412.snowflakecomputing.com/" +
        "?db=MONEY_DB&schema=ANALYTICS&warehouse=COMPUTE_WH&role=ACCOUNTADMIN";

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() throws Exception {
        Properties properties = new Properties();
        properties.put("user", "Neha");
        properties.put("password", "Snowflake@Neha123");
        properties.put("role", "ACCOUNTADMIN");

        try (Connection conn = DriverManager.getConnection(snowflakeUrl, properties);
             Statement stmt = conn.createStatement()) {

            Map<String, Object> response = new HashMap<>();

            // ── EXISTING: Transaction KPIs ────────────────────────────────────

            try (ResultSet rs = stmt.executeQuery(
                    "SELECT COUNT(*) FROM FACT_TRANSACTIONS WHERE DATE_KEY = CURRENT_DATE()")) {
                if (rs.next()) response.put("dailyTransactions", rs.getLong(1));
            }

            try (ResultSet rs = stmt.executeQuery(
                    "SELECT (COUNT(CASE WHEN STATUS='SUCCESS' THEN 1 END) * 100.0 " +
                    "/ NULLIF(COUNT(*), 0)) FROM FACT_TRANSACTIONS")) {
                if (rs.next()) response.put("successRate", rs.getDouble(1));
            }

            try (ResultSet rs = stmt.executeQuery(
                    "SELECT AVG(AMOUNT) FROM FACT_TRANSACTIONS WHERE STATUS = 'SUCCESS'")) {
                if (rs.next()) response.put("avgAmount", rs.getDouble(1));
            }

            // ── EXISTING: 7-day transaction trend ────────────────────────────

            List<String> labels = new ArrayList<>();
            List<Long> values = new ArrayList<>();
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT DATE_KEY, COUNT(*) FROM FACT_TRANSACTIONS " +
                    "GROUP BY DATE_KEY ORDER BY DATE_KEY DESC LIMIT 7")) {
                while (rs.next()) {
                    labels.add(rs.getString(1));
                    values.add(rs.getLong(2));
                }
            }
            response.put("trendLabels", labels);
            response.put("trendValues", values);

            // ── EXISTING: Status distribution ─────────────────────────────────

            Map<String, Long> statusDist = new HashMap<>();
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT STATUS, COUNT(*) FROM FACT_TRANSACTIONS GROUP BY STATUS")) {
                while (rs.next()) statusDist.put(rs.getString(1), rs.getLong(2));
            }
            response.put("statusDist", statusDist);

            // ── EXISTING: Peak hour & top user ────────────────────────────────

            try (ResultSet rs = stmt.executeQuery(
                    "SELECT HOUR(CAST(CREATED_ON AS TIMESTAMP)) AS h FROM FACT_TRANSACTIONS " +
                    "GROUP BY h ORDER BY COUNT(*) DESC LIMIT 1")) {
                if (rs.next()) response.put("peakHour", rs.getInt(1));
            }

            try (ResultSet rs = stmt.executeQuery(
                    "SELECT a.HOLDER_NAME FROM FACT_TRANSACTIONS f " +
                    "JOIN DIM_ACCOUNTS a ON f.FROM_ACCOUNT_ID = a.ACCOUNT_ID " +
                    "GROUP BY a.HOLDER_NAME ORDER BY COUNT(*) DESC LIMIT 1")) {
                if (rs.next()) response.put("topAccount", rs.getString(1));
            }

            // ── NEW: Reward KPIs ──────────────────────────────────────────────

            // Total points ever issued across all users
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT COALESCE(SUM(POINTS_EARNED), 0) FROM FACT_REWARDS")) {
                if (rs.next()) response.put("totalPointsIssued", rs.getLong(1));
            }

            // Rewards granted today
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT COUNT(*) FROM FACT_REWARDS WHERE DATE_KEY = CURRENT_DATE()")) {
                if (rs.next()) response.put("rewardsToday", rs.getLong(1));
            }

            // Average points per rewarded transaction
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT COALESCE(AVG(POINTS_EARNED), 0) FROM FACT_REWARDS")) {
                if (rs.next()) response.put("avgPointsPerTxn", rs.getDouble(1));
            }

            // Most rewarded user (by total points)
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT u.USERNAME, SUM(r.POINTS_EARNED) AS total " +
                    "FROM FACT_REWARDS r JOIN DIM_USERS u ON r.USER_ID = u.USER_ID " +
                    "GROUP BY u.USERNAME ORDER BY total DESC LIMIT 1")) {
                if (rs.next()) {
                    response.put("topRewardUser", rs.getString(1));
                    response.put("topRewardUserPoints", rs.getLong(2));
                }
            }

            // Points by user — for the bar chart (top 5 users)
            List<String> rewardUserLabels = new ArrayList<>();
            List<Long> rewardUserPoints   = new ArrayList<>();
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT u.USERNAME, SUM(r.POINTS_EARNED) AS total " +
                    "FROM FACT_REWARDS r JOIN DIM_USERS u ON r.USER_ID = u.USER_ID " +
                    "GROUP BY u.USERNAME ORDER BY total DESC LIMIT 5")) {
                while (rs.next()) {
                    rewardUserLabels.add(rs.getString(1));
                    rewardUserPoints.add(rs.getLong(2));
                }
            }
            response.put("rewardUserLabels", rewardUserLabels);
            response.put("rewardUserPoints", rewardUserPoints);

            // 7-day reward trend (points issued per day)
            List<String> rewardTrendLabels = new ArrayList<>();
            List<Long> rewardTrendValues   = new ArrayList<>();
            try (ResultSet rs = stmt.executeQuery(
                    "SELECT DATE_KEY, SUM(POINTS_EARNED) FROM FACT_REWARDS " +
                    "GROUP BY DATE_KEY ORDER BY DATE_KEY DESC LIMIT 7")) {
                while (rs.next()) {
                    rewardTrendLabels.add(rs.getString(1));
                    rewardTrendValues.add(rs.getLong(2));
                }
            }
            response.put("rewardTrendLabels", rewardTrendLabels);
            response.put("rewardTrendValues", rewardTrendValues);

            return response;
        }
    }
}