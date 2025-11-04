/*
  Warnings:

  - The primary key for the `Friend` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Match` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Tournament` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Friend" (
    "user_id" TEXT NOT NULL,
    "friend_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("user_id", "friend_id"),
    CONSTRAINT "Friend_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Friend_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Friend" ("created_at", "friend_id", "status", "user_id") SELECT "created_at", "friend_id", "status", "user_id" FROM "Friend";
DROP TABLE "Friend";
ALTER TABLE "new_Friend" RENAME TO "Friend";
CREATE TABLE "new_Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
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
    CONSTRAINT "Match_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_p1_user_id_fkey" FOREIGN KEY ("p1_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_p2_user_id_fkey" FOREIGN KEY ("p2_user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Match" ("closed_at", "created_at", "game_code", "game_index", "id", "onchain_at", "p1_ref", "p1_score", "p1_user_id", "p2_ref", "p2_score", "p2_user_id", "round", "status", "tournament_id", "tx_hash", "updated_at", "winner_ref", "winner_user_id") SELECT "closed_at", "created_at", "game_code", "game_index", "id", "onchain_at", "p1_ref", "p1_score", "p1_user_id", "p2_ref", "p2_score", "p2_user_id", "round", "status", "tournament_id", "tx_hash", "updated_at", "winner_ref", "winner_user_id" FROM "Match";
DROP TABLE "Match";
ALTER TABLE "new_Match" RENAME TO "Match";
CREATE INDEX "Match_tournament_id_idx" ON "Match"("tournament_id");
CREATE INDEX "Match_status_idx" ON "Match"("status");
CREATE UNIQUE INDEX "Match_tournament_id_round_game_index_key" ON "Match"("tournament_id", "round", "game_index");
CREATE TABLE "new_Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Session" ("created_at", "expires_at", "id", "token_hash", "user_id") SELECT "created_at", "expires_at", "id", "token_hash", "user_id" FROM "Session";
DROP TABLE "Session";
ALTER TABLE "new_Session" RENAME TO "Session";
CREATE UNIQUE INDEX "Session_token_hash_key" ON "Session"("token_hash");
CREATE TABLE "new_Tournament" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tournament_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Tournament" ("created_at", "created_by", "id", "name", "status") SELECT "created_at", "created_by", "id", "name", "status" FROM "Tournament";
DROP TABLE "Tournament";
ALTER TABLE "new_Tournament" RENAME TO "Tournament";
CREATE INDEX "Tournament_status_idx" ON "Tournament"("status");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar_url" TEXT,
    "player_ref" TEXT,
    "2fa_secret" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("2fa_secret", "avatar_url", "created_at", "email", "id", "passwordHash", "player_ref", "updated_at", "username") SELECT "2fa_secret", "avatar_url", "created_at", "email", "id", "passwordHash", "player_ref", "updated_at", "username" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_player_ref_key" ON "User"("player_ref");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
