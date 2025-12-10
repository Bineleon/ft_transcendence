-- CreateTable
CREATE TABLE "_TournamentParticipants" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TournamentParticipants_A_fkey" FOREIGN KEY ("A") REFERENCES "Tournament" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TournamentParticipants_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_TournamentParticipants_AB_unique" ON "_TournamentParticipants"("A", "B");

-- CreateIndex
CREATE INDEX "_TournamentParticipants_B_index" ON "_TournamentParticipants"("B");
