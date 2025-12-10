// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title TournamentScore
 * @dev Store tournament scores immutably on Avalanche blockchain
 * @notice This contract is designed for the ft_transcendence Pong game
 */
contract TournamentScore {
    
    // Structure to store tournament result
    struct TournamentResult {
        string tournamentId;       // Unique tournament identifier from backend
        address registrar;         // Address that registered the score
        string winnerUsername;     // Winner's username
        string runnerUpUsername;   // Second place username
        uint8 winnerScore;         // Winner's final score
        uint8 runnerUpScore;       // Runner-up's final score
        uint8 totalPlayers;        // Total number of participants (4, 8, or 16)
        uint256 timestamp;         // When the tournament ended
    }
    
    // Mapping: tournamentId => TournamentResult
    mapping(string => TournamentResult) private tournaments;
    
    // Array to iterate over tournament IDs
    string[] private tournamentIds;
    
    // Event emitted when a tournament is stored
    event TournamentStored(
        string indexed tournamentId,
        string winnerUsername,
        string runnerUpUsername,
        uint8 winnerScore,
        uint8 runnerUpScore,
        uint8 totalPlayers,
        uint256 timestamp
    );
    
    /**
     * @dev Store a tournament result on the blockchain
     * @param _tournamentId Unique tournament ID from backend database
     * @param _winnerUsername Username of the tournament winner
     * @param _runnerUpUsername Username of the second place
     * @param _winnerScore Winner's score in the final match
     * @param _runnerUpScore Runner-up's score in the final match
     * @param _totalPlayers Total number of tournament participants
     */
    function storeTournament(
        string memory _tournamentId,
        string memory _winnerUsername,
        string memory _runnerUpUsername,
        uint8 _winnerScore,
        uint8 _runnerUpScore,
        uint8 _totalPlayers
    ) external {
        // Ensure tournament doesn't already exist
        require(
            tournaments[_tournamentId].timestamp == 0,
            "Tournament already stored"
        );
        
        // Validate total players (must be 4, 8, or 16)
        require(
            _totalPlayers == 4 || _totalPlayers == 8 || _totalPlayers == 16,
            "Invalid player count"
        );
        
        // Validate scores (Pong typically goes to 5 points)
        require(_winnerScore > _runnerUpScore, "Winner must have higher score");
        require(_winnerScore <= 5, "Score too high");
        
        // Create and store the tournament result
        tournaments[_tournamentId] = TournamentResult({
            tournamentId: _tournamentId,
            registrar: msg.sender,
            winnerUsername: _winnerUsername,
            runnerUpUsername: _runnerUpUsername,
            winnerScore: _winnerScore,
            runnerUpScore: _runnerUpScore,
            totalPlayers: _totalPlayers,
            timestamp: block.timestamp
        });
        
        // Add to array for iteration
        tournamentIds.push(_tournamentId);
        
        // Emit event for transparency
        emit TournamentStored(
            _tournamentId,
            _winnerUsername,
            _runnerUpUsername,
            _winnerScore,
            _runnerUpScore,
            _totalPlayers,
            block.timestamp
        );
    }
    
    /**
     * @dev Retrieve a tournament result
     * @param _tournamentId The tournament ID to query
     * @return TournamentResult struct with all tournament data
     */
    function getTournament(string memory _tournamentId) 
        external 
        view 
        returns (TournamentResult memory) 
    {
        require(
            tournaments[_tournamentId].timestamp != 0,
            "Tournament not found"
        );
        return tournaments[_tournamentId];
    }
    
    /**
     * @dev Check if a tournament exists on the blockchain
     * @param _tournamentId The tournament ID to check
     * @return bool True if tournament exists
     */
    function tournamentExists(string memory _tournamentId) 
        external 
        view 
        returns (bool) 
    {
        return tournaments[_tournamentId].timestamp != 0;
    }
    
    /**
     * @dev Get total number of tournaments stored
     * @return uint256 Total count of tournaments
     */
    function getTotalTournaments() external view returns (uint256) {
        return tournamentIds.length;
    }
    
    /**
     * @dev Get tournament ID by index
     * @param _index Index in the array
     * @return string Tournament ID
     */
    function getTournamentIdByIndex(uint256 _index) 
        external 
        view 
        returns (string memory) 
    {
        require(_index < tournamentIds.length, "Index out of bounds");
        return tournamentIds[_index];
    }
}