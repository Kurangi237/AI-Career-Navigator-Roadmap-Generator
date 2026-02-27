import { ContestEntry, LeaderboardRow } from '@shared/types';

export const calculateFinalScore = (entry: ContestEntry) => {
  const totalPoints = entry.problemScores.reduce((sum, p) => sum + (p.solved ? p.points : 0), 0);
  const penaltyMinutes = entry.problemScores.reduce((sum, p) => sum + p.wrongSubmissions * 5, 0);
  const finishTime = entry.problemScores.reduce((max, p) => (p.solvedAt && p.solvedAt > max ? p.solvedAt : max), 0);
  const tiebreaker = finishTime + penaltyMinutes * 60 * 1000;

  return {
    totalPoints,
    penaltyMinutes,
    finishTime,
    tiebreaker,
  };
};

export const buildLeaderboardFromEntries = (entries: ContestEntry[]): LeaderboardRow[] => {
  const scored = entries
    .map((entry) => {
      const calc = calculateFinalScore(entry);
      return {
        ...entry,
        ...calc,
      };
    })
    .sort((a, b) => (b.totalPoints - a.totalPoints) || (a.tiebreaker - b.tiebreaker));

  return scored.map((entry, idx) => {
    const problemResults: LeaderboardRow['problemResults'] = {};
    entry.problemScores.forEach((p) => {
      problemResults[p.problemId] = {
        ac: p.solved,
        attempts: p.wrongSubmissions + (p.solved ? 1 : 0),
        solvedAt: p.solvedAt,
        points: p.solved ? p.points : 0,
      };
    });
    return {
      rank: idx + 1,
      userId: entry.userId,
      username: entry.username,
      totalPoints: entry.totalPoints,
      penaltyMinutes: entry.penaltyMinutes,
      finishTime: entry.finishTime,
      tiebreaker: entry.tiebreaker,
      problemResults,
    };
  });
};
