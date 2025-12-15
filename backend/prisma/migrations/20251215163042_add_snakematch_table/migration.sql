-- CreateTable
CREATE TABLE "SnakeMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_code" TEXT NOT NULL DEFAULT 'snake',
    "p1_user_id" TEXT,
    "p1_score" INTEGER NOT NULL,
    "p1_collectibles" INTEGER NOT NULL,
    "p2_user_id" TEXT,
    "p2_score" INTEGER NOT NULL,
    "p2_collectibles" INTEGER NOT NULL,
    "winner_user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SnakeMatch_winner_user_id_fkey" FOREIGN KEY ("winner_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SnakeMatch_p2_user_id_fkey" FOREIGN KEY ("p2_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SnakeMatch_p1_user_id_fkey" FOREIGN KEY ("p1_user_id") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "SnakeMatch_p1_user_id_idx" ON "SnakeMatch"("p1_user_id");

-- CreateIndex
CREATE INDEX "SnakeMatch_p2_user_id_idx" ON "SnakeMatch"("p2_user_id");

-- CreateIndex
CREATE INDEX "SnakeMatch_winner_user_id_idx" ON "SnakeMatch"("winner_user_id");
