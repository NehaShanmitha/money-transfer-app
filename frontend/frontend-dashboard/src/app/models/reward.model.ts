export interface RewardResponse {
  id: number;
  transactionId: string;
  pointsEarned: number;
  createdOn: string; // ISO datetime string from backend
}

export interface RewardSummary {
  totalPoints: number;
}