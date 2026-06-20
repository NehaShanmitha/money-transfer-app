package com.example.demo.repository;

import com.example.demo.entity.RewardLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RewardLogRepo extends JpaRepository<RewardLog, Long> {

    List<RewardLog> findByUserIdOrderByCreatedOnDesc(int userId);

    @Query("SELECT COALESCE(SUM(r.pointsEarned), 0) FROM RewardLog r WHERE r.userId = :userId")
    int sumPointsByUserId(@Param("userId") int userId);
}