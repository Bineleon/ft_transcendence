// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TournamentScores
 * @dev Enregistre les résultats de tournois Pong sur Avalanche
 */
contract TournamentScores {
    
    // Structure d'un tournoi enregistré
    struct Tournament {
        string tournamentId;      // ID depuis ta DB backend
        string winnerUsername;    // Username du gagnant
        uint8 playerCount;        // Nombre de participants (4, 8, 16)
        uint256 timestamp;        // Date de fin
        bool exists;              // Pour vérifier l'existence
    }
    
    // Mapping: tournamentId => Tournament
    mapping(string => Tournament) public tournaments;
    
    // Liste des IDs de tournois (pour itération)
    string[] public tournamentIds;
    
    // Événement émis lors de l'enregistrement
    event TournamentRegistered(
        string indexed tournamentId,
        string winnerUsername,
        uint8 playerCount,
        uint256 timestamp
    );
    
    /**
     * @dev Enregistre un tournoi sur la blockchain
     * @param _tournamentId ID du tournoi (depuis ta DB)
     * @param _winnerUsername Username du gagnant
     * @param _playerCount Nombre de participants
     */
    function registerTournament(
        string memory _tournamentId,
        string memory _winnerUsername,
        uint8 _playerCount
    ) public {
        // Vérifier que le tournoi n'existe pas déjà
        require(!tournaments[_tournamentId].exists, "Tournament already registered");
        
        // Vérifier que playerCount est valide (4, 8, ou 16)
        require(
            _playerCount == 4 || _playerCount == 8 || _playerCount == 16,
            "Invalid player count"
        );
        
        // Créer le tournoi
        tournaments[_tournamentId] = Tournament({
            tournamentId: _tournamentId,
            winnerUsername: _winnerUsername,
            playerCount: _playerCount,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Ajouter l'ID à la liste
        tournamentIds.push(_tournamentId);
        
        // Émettre l'événement
        emit TournamentRegistered(
            _tournamentId,
            _winnerUsername,
            _playerCount,
            block.timestamp
        );
    }
    
    /**
     * @dev Récupère les infos d'un tournoi
     * @param _tournamentId ID du tournoi
     * @return Tournament struct
     */
    function getTournament(string memory _tournamentId) 
        public 
        view 
        returns (Tournament memory) 
    {
        require(tournaments[_tournamentId].exists, "Tournament not found");
        return tournaments[_tournamentId];
    }
    
    /**
     * @dev Récupère le nombre total de tournois enregistrés
     * @return uint256 nombre de tournois
     */
    function getTournamentCount() public view returns (uint256) {
        return tournamentIds.length;
    }
    
    /**
     * @dev Récupère un tournoi par son index dans la liste
     * @param _index Index du tournoi
     * @return Tournament struct
     */
    function getTournamentByIndex(uint256 _index) 
        public 
        view 
        returns (Tournament memory) 
    {
        require(_index < tournamentIds.length, "Index out of bounds");
        string memory tournamentId = tournamentIds[_index];
        return tournaments[tournamentId];
    }
}