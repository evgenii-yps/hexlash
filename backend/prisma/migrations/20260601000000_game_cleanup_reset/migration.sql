-- Game-cleanup reset (2026-06-01)
-- Drops all game tables and removes all game scalar columns from "User".
-- Keeps only account / auth / web3 / referral data.
--
-- DROP TABLE ... CASCADE removes inter-table foreign keys AND the
-- "User".clanId -> "Clan" foreign-key constraint, so the User column drops
-- below run cleanly afterward. IF EXISTS guards make this safe to run on
-- test/dev/prod regardless of prior state.

-- 1. Drop game tables ------------------------------------------------------
DROP TABLE IF EXISTS "AgentFightLog" CASCADE;
DROP TABLE IF EXISTS "AgentProgression" CASCADE;
DROP TABLE IF EXISTS "AgentTactics" CASCADE;
DROP TABLE IF EXISTS "Agent" CASCADE;
DROP TABLE IF EXISTS "FightClub" CASCADE;
DROP TABLE IF EXISTS "PunchInfo" CASCADE;
DROP TABLE IF EXISTS "Friendship" CASCADE;
DROP TABLE IF EXISTS "FriendRequest" CASCADE;
DROP TABLE IF EXISTS "Fight" CASCADE;
DROP TABLE IF EXISTS "UserDailyTask" CASCADE;
DROP TABLE IF EXISTS "DailyTask" CASCADE;
DROP TABLE IF EXISTS "UserSocialTask" CASCADE;
DROP TABLE IF EXISTS "SocialTask" CASCADE;
DROP TABLE IF EXISTS "UserAchievement" CASCADE;
DROP TABLE IF EXISTS "Achievement" CASCADE;
DROP TABLE IF EXISTS "ClanInvite" CASCADE;
DROP TABLE IF EXISTS "ClanEvent" CASCADE;
DROP TABLE IF EXISTS "Clan" CASCADE;

-- 2. Drop game scalar columns from "User" ----------------------------------
ALTER TABLE "User"
  DROP COLUMN IF EXISTS "balance",
  DROP COLUMN IF EXISTS "skin",
  DROP COLUMN IF EXISTS "rating",
  DROP COLUMN IF EXISTS "totalFights",
  DROP COLUMN IF EXISTS "wins",
  DROP COLUMN IF EXISTS "losses",
  DROP COLUMN IF EXISTS "draws",
  DROP COLUMN IF EXISTS "pveWins",
  DROP COLUMN IF EXISTS "pveLosses",
  DROP COLUMN IF EXISTS "pveDraws",
  DROP COLUMN IF EXISTS "pveTotalFights",
  DROP COLUMN IF EXISTS "pvpWins",
  DROP COLUMN IF EXISTS "pvpLosses",
  DROP COLUMN IF EXISTS "pvpDraws",
  DROP COLUMN IF EXISTS "pvpTotalFights",
  DROP COLUMN IF EXISTS "totalTaps",
  DROP COLUMN IF EXISTS "progression",
  DROP COLUMN IF EXISTS "deck",
  DROP COLUMN IF EXISTS "luckPercentage",
  DROP COLUMN IF EXISTS "wonTokens",
  DROP COLUMN IF EXISTS "freeTokens",
  DROP COLUMN IF EXISTS "lostTokens",
  DROP COLUMN IF EXISTS "noSkipDays",
  DROP COLUMN IF EXISTS "clanId",
  DROP COLUMN IF EXISTS "clanRole";
