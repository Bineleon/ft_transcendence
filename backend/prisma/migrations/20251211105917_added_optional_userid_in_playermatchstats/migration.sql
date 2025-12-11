-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PlayerMatchStats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "match_id" TEXT NOT NULL,
    "user_id" TEXT,
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
INSERT INTO "new_PlayerMatchStats" ("created_at", "fastest_lost_rally", "fastest_won_rally", "id", "match_id", "max_ball_speed_lost", "max_ball_speed_won", "max_bounces_in_won_rally", "max_effects_in_won_rally", "max_wins", "score", "total_ball_spins", "user_id") SELECT "created_at", "fastest_lost_rally", "fastest_won_rally", "id", "match_id", "max_ball_speed_lost", "max_ball_speed_won", "max_bounces_in_won_rally", "max_effects_in_won_rally", "max_wins", "score", "total_ball_spins", "user_id" FROM "PlayerMatchStats";
DROP TABLE "PlayerMatchStats";
ALTER TABLE "new_PlayerMatchStats" RENAME TO "PlayerMatchStats";
CREATE INDEX "PlayerMatchStats_user_id_idx" ON "PlayerMatchStats"("user_id");
CREATE INDEX "PlayerMatchStats_match_id_idx" ON "PlayerMatchStats"("match_id");
CREATE UNIQUE INDEX "PlayerMatchStats_match_id_user_id_key" ON "PlayerMatchStats"("match_id", "user_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
