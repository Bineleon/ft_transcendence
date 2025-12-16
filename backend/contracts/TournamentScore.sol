// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TournamentScore {
    struct Match {
        uint256 matchId;
        string player1;
        string player2;
        uint256 scorePlayer1;
        uint256 scorePlayer2;
        string winner;
        uint256 timestamp;
    }

    struct Tournament {
        uint256 id;
        string winner;
        string[] players;
        Match[] matches;
        uint256 timestamp;
        bool exists;
    }

    mapping(uint256 => Tournament) private tournaments;
    uint256 private tournamentCount;

    event TournamentRecorded(
        uint256 indexed tournamentId,
        string winner,
        uint256 matchCount,
        uint256 timestamp
    );

    event MatchRecorded(
        uint256 indexed tournamentId,
        uint256 indexed matchId,
        string player1,
        string player2,
        string winner
    );

    /**
     * @dev Enregistrer un nouveau tournoi avec tous ses matchs
     */
    function recordTournament(
        uint256 _tournamentId,
        string memory _winner,
        string[] memory _players,
        Match[] memory _matches
    ) public {
        require(!tournaments[_tournamentId].exists, "Tournament already exists");
        require(_players.length >= 2, "At least 2 players required");
        require(_matches.length > 0, "At least one match required");
        require(bytes(_winner).length > 0, "Winner cannot be empty");

        Tournament storage newTournament = tournaments[_tournamentId];
        newTournament.id = _tournamentId;
        newTournament.winner = _winner;
        newTournament.timestamp = block.timestamp;
        newTournament.exists = true;

        // Ajouter les joueurs
        for (uint256 i = 0; i < _players.length; i++) {
            newTournament.players.push(_players[i]);
        }

        // Ajouter les matchs
        for (uint256 i = 0; i < _matches.length; i++) {
            newTournament.matches.push(_matches[i]);
            
            emit MatchRecorded(
                _tournamentId,
                _matches[i].matchId,
                _matches[i].player1,
                _matches[i].player2,
                _matches[i].winner
            );
        }

        tournamentCount++;

        emit TournamentRecorded(
            _tournamentId,
            _winner,
            _matches.length,
            block.timestamp
        );
    }

    /**
     * @dev Récupérer un tournoi complet
     */
    function getTournament(uint256 _tournamentId)
        public
        view
        returns (Tournament memory)
    {
        require(tournaments[_tournamentId].exists, "Tournament does not exist");
        return tournaments[_tournamentId];
    }

    /**
     * @dev Récupérer les matchs d'un tournoi
     */
    function getTournamentMatches(uint256 _tournamentId)
        public
        view
        returns (Match[] memory)
    {
        require(tournaments[_tournamentId].exists, "Tournament does not exist");
        return tournaments[_tournamentId].matches;
    }

    /**
     * @dev Vérifier si un tournoi existe
     */
    function tournamentExists(uint256 _tournamentId)
        public
        view
        returns (bool)
    {
        return tournaments[_tournamentId].exists;
    }

    /**
     * @dev Obtenir le nombre total de tournois
     */
    function getTournamentCount() public view returns (uint256) {
        return tournamentCount;
    }

    /**
     * @dev Obtenir le nombre de matchs d'un tournoi
     */
    function getMatchCount(uint256 _tournamentId)
        public
        view
        returns (uint256)
    {
        require(tournaments[_tournamentId].exists, "Tournament does not exist");
        return tournaments[_tournamentId].matches.length;
    }
}