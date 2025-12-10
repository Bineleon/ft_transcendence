-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT,
    "game_code" TEXT NOT NULL DEFAULT 'pong',
    "round" INTEGER,
    "game_index" INTEGER,
    "p1_user_id" TEXT NOT NULL,
    "p1_ref" TEXT,
    "p1_score" INTEGER,
    "p2_user_id" TEXT NOT NULL,
    "p2_ref" TEXT,
    "p2_score" INTEGER,
    "winner_user_id" TEXT,
    "winner_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "tx_hash" TEXT,
    "onchain_at" DATETIME,
    "closed_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Match_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Match_p2_user_id_fkey" FOREIGN KEY ("p2_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_p1_user_id_fkey" FOREIGN KEY ("p1_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("closed_at", "created_at", "game_code", "game_index", "id", "onchain_at", "p1_ref", "p1_score", "p1_user_id", "p2_ref", "p2_score", "p2_user_id", "round", "status", "tournament_id", "tx_hash", "updated_at", "winner_ref", "winner_user_id") SELECT "closed_at", "created_at", "game_code", "game_index", "id", "onchain_at", "p1_ref", "p1_score", "p1_user_id", "p2_ref", "p2_score", "p2_user_id", "round", "status", "tournament_id", "tx_hash", "updated_at", "winner_ref", "winner_user_id" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_tournament_id_idx" ON "Match"("tournament_id");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE UNIQUE INDEX "Match_tournament_id_round_game_index_key" ON "Match"("tournament_id", "round", "game_index");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
