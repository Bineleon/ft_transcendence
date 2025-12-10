-- AlterTable
ALTER TABLE "Match" ADD COLUMN "avg_rally_bounces" REAL;
ALTER TABLE "Match" ADD COLUMN "avg_rally_time" REAL;
ALTER TABLE "Match" ADD COLUMN "loser_user_id" TEXT;
ALTER TABLE "Match" ADD COLUMN "max_bounces" INTEGER;
ALTER TABLE "Match" ADD COLUMN "total_match_time" REAL;
ALTER TABLE "Match" ADD COLUMN "total_points" INTEGER;
ALTER TABLE "Match" ADD COLUMN "total_rallies" INTEGER;

-- CreateTable
CREATE TABLE "PlayerMatchStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "max_wins" INTEGER NOT NULL DEFAULT 0,
    "total_ball_spins" INTEGER NOT NULL DEFAULT 0,
    "max_bounces_in_won_rally" INTEGER NOT NULL DEFAULT 0,
    "max_effects_in_won_rally" INTEGER NOT NULL DEFAULT 0,
    "max_ball_speed_won" REAL NOT NULL DEFAULT 0,
    "max_ball_speed_lost" REAL NOT NULL DEFAULT 0,
    "fastest_won_rally" REAL NOT NULL DEFAULT 0,
    "fastest_lost_rally" REAL NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerMatchStats_match_id_fkey" FOREIGN KEY ("match_id") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "PlayerMatchStats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PlayerMatchStats_user_id_idx" ON "PlayerMatchStats"("user_id");

-- CreateIndex
CREATE INDEX "PlayerMatchStats_match_id_idx" ON "PlayerMatchStats"("match_id");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerMatchStats_match_id_user_id_key" ON "PlayerMatchStats"("match_id", "user_id");
