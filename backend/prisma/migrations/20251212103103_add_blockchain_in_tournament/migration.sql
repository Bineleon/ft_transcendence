/*
  Warnings:

  - You are about to drop the column `tx_hash` on the `Match` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN "block_number" INTEGER;
ALTER TABLE "Tournament" ADD COLUMN "blockchain_error" TEXT;
ALTER TABLE "Tournament" ADD COLUMN "onchain_at" DATETIME;
ALTER TABLE "Tournament" ADD COLUMN "tx_hash" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT,
    "game_code" TEXT NOT NULL DEFAULT 'pong',
    "round" INTEGER,
    "game_index" INTEGER,
    "p1_user_id" TEXT,
    "p1_ref" TEXT,
    "p1_score" INTEGER,
    "p2_user_id" TEXT,
    "p2_ref" TEXT,
    "p2_score" INTEGER,
    "winner_user_id" TEXT,
    "winner_ref" TEXT,
    "loser_user_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "onchain_at" DATETIME,
    "closed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_points" INTEGER,
    "total_rallies" INTEGER,
    "max_bounces" INTEGER,
    "avg_rally_bounces" REAL,
    "total_match_time" REAL,
    "avg_rally_time" REAL,
    CONSTRAINT "Match_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_p2_user_id_fkey" FOREIGN KEY ("p2_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_p1_user_id_fkey" FOREIGN KEY ("p1_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("avg_rally_bounces", "avg_rally_time", "closed_at", "created_at", "game_code", "game_index", "id", "loser_user_id", "max_bounces", "onchain_at", "p1_ref", "p1_score", "p1_user_id", "p2_ref", "p2_score", "p2_user_id", "round", "status", "total_match_time", "total_points", "total_rallies", "tournament_id", "updated_at", "winner_ref", "winner_user_id") SELECT "avg_rally_bounces", "avg_rally_time", "closed_at", "created_at", "game_code", "game_index", "id", "loser_user_id", "max_bounces", "onchain_at", "p1_ref", "p1_score", "p1_user_id", "p2_ref", "p2_score", "p2_user_id", "round", "status", "total_match_time", "total_points", "total_rallies", "tournament_id", "updated_at", "winner_ref", "winner_user_id" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_tournament_id_idx" ON "Match"("tournament_id");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE UNIQUE INDEX "Match_tournament_id_round_game_index_key" ON "Match"("tournament_id", "round", "game_index");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
