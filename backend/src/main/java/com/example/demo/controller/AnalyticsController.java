package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import java.sql.*;
import java.util.*;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:4200")
public class AnalyticsController {

    private final String snowflakeUrl = "jdbc:snowflake://pyfxlle-cgc84412.snowflakecomputing.com/?db=MONEY_DB&schema=ANALYTICS&warehouse=COMPUTE_WH&role=ACCOUNTADMIN";

    @GetMapping("/stats")
    public Map<String, Object> getDashboardStats() throws Exception {
        Properties properties = new Properties();
        properties.put("user", "Neha");
        properties.put("password", "Snowflake@Neha123");
        properties.put("role", "ACCOUNTADMIN");

        try (Connection conn = DriverManager.getConnection(snowflakeUrl, properties);
             Statement stmt = conn.createStatement()) {

            Map<String, Object> response = new HashMap<>();

            // 1. KPI Metrics [cite: 402, 404, 406]
            try (ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM FACT_TRANSACTIONS WHERE DATE_KEY = CURRENT_DATE()")) {
                if (rs.next()) response.put("dailyTransactions", rs.getLong(1));
            }
            try (ResultSet rs = stmt.executeQuery("SELECT (COUNT(CASE WHEN status='SUCCESS' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)) FROM FACT_TRANSACTIONS")) {
                if (rs.next()) response.put("successRate", rs.getDouble(1));
            }
            try (ResultSet rs = stmt.executeQuery("SELECT AVG(AMOUNT) FROM FACT_TRANSACTIONS WHERE STATUS = 'SUCCESS'")) {
                if (rs.next()) response.put("avgAmount", rs.getDouble(1));
            }

            // 2. Chart Data: Transaction Trend (Last 7 Days) [cite: 402]
            List<String> labels = new ArrayList<>();
            List<Long> values = new ArrayList<>();
            String trendSql = "SELECT DATE_KEY, COUNT(*) FROM FACT_TRANSACTIONS GROUP BY DATE_KEY ORDER BY DATE_KEY DESC LIMIT 7";
            try (ResultSet rs = stmt.executeQuery(trendSql)) {
                while (rs.next()) {
                    labels.add(rs.getString(1));
                    values.add(rs.getLong(2));
                }
            }
            response.put("trendLabels", labels);
            response.put("trendValues", values);

            // 3. Chart Data: Status Distribution (For Doughnut Chart) [cite: 404]
            Map<String, Long> statusDist = new HashMap<>();
            try (ResultSet rs = stmt.executeQuery("SELECT STATUS, COUNT(*) FROM FACT_TRANSACTIONS GROUP BY STATUS")) {
                while (rs.next()) statusDist.put(rs.getString(1), rs.getLong(2));
            }
            response.put("statusDist", statusDist);

            // 4. Peak Hour & Top User [cite: 403, 405]
            String peakSql = "SELECT HOUR(CAST(CREATED_ON AS TIMESTAMP)) as h FROM FACT_TRANSACTIONS GROUP BY h ORDER BY COUNT(*) DESC LIMIT 1";
            try (ResultSet rs = stmt.executeQuery(peakSql)) {
                if (rs.next()) response.put("peakHour", rs.getInt(1));
            }
            String topUserSql = "SELECT a.HOLDER_NAME FROM FACT_TRANSACTIONS f JOIN DIM_ACCOUNTS a ON f.FROM_ACCOUNT_ID = a.ACCOUNT_ID GROUP BY 1 ORDER BY COUNT(*) DESC LIMIT 1";
            try (ResultSet rs = stmt.executeQuery(topUserSql)) {
                if (rs.next()) response.put("topAccount", rs.getString(1));
            }

            return response;
        }
    }
}