import { ContestResult, EloRating } from '@shared/types';

const KEY = 'KBV_elo_ratings';
const BASE = 1200;
const K = 24;

const read = (): Record<string, EloRating> => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const write = (ratings: Record<string, EloRating>) => {
  localStorage.setItem(KEY, JSON.stringify(ratings));
};

const ensure = (ratings: Record<string, EloRating>, email: string): EloRating => {
  const existing = ratings[email];
  if (existing) return existing;
  const next: EloRating = {
    userEmail: email,
    rating: BASE,
    contestsPlayed: 0,
    updatedAt: Date.now(),
  };
  ratings[email] = next;
  return next;
};

const expected = (ra: number, rb: number) => 1 / (1 + Math.pow(10, (rb - ra) / 400));

export const applyRoomElo = (roomResults: ContestResult[]): Record<string, EloRating> => {
  if (roomResults.length < 2) return read();
  const sorted = [...roomResults].sort((a, b) => (b.score - a.score) || (a.submittedAt - b.submittedAt));
  const ratings = read();
  const players = sorted.map((r) => ensure(ratings, r.userEmail));

  for (let i = 0; i < players.length; i++) {
    let delta = 0;
    for (let j = 0; j < players.length; j++) {
      if (i === j) continue;
      const actual = i < j ? 1 : i > j ? 0 : 0.5;
      const exp = expected(players[i].rating, players[j].rating);
      delta += K * (actual - exp);
    }
    players[i].rating = Math.max(100, Math.round(players[i].rating + delta));
    players[i].contestsPlayed += 1;
    players[i].updatedAt = Date.now();
    ratings[players[i].userEmail] = players[i];
  }

  write(ratings);
  return ratings;
};

export const getEloRating = (userEmail: string): EloRating => {
  const ratings = read();
  return ratings[userEmail] || {
    userEmail,
    rating: BASE,
    contestsPlayed: 0,
    updatedAt: Date.now(),
  };
};

export const getTopElo = (limit = 20): EloRating[] => {
  return Object.values(read())
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
};

