// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BaseJump is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct GameInfo {
        uint256 fid;         // Farcaster ID
        uint256 score;       // Latest recorded score
        uint256 lastPlayed;  // Timestamp of last game
        uint256 bestScore;   // Best score achieved (for leaderboard)
        uint256 totalGames;  // Total number of games played
    }

    struct LeaderboardEntry {
        address player;
        uint256 fid;
        uint256 bestScore;
        uint256 lastPlayed;
    }

    // Mapping to track used signatures
    mapping(bytes => bool) public usedSignatures;

    // Server's public key for signature verification
    address public serverSigner;

    // Mapping of user addresses to their game info
    mapping(address => GameInfo) public userGameInfo;

    // Leaderboard: top scores sorted by bestScore (descending)
    LeaderboardEntry[] public leaderboard;
    uint256 public constant MAX_LEADERBOARD_SIZE = 100;

    // Minimum score to qualify for leaderboard
    uint256 public minLeaderboardScore = 0;

    event TokenRewarded(address indexed user, address indexed token, uint256 amount);
    event ServerSignerUpdated(address indexed newSigner);
    event GameStarted(address indexed user, uint256 fid, uint256 timestamp);
    event ScoreStored(address indexed user, uint256 fid, uint256 score, uint256 timestamp);
    event LeaderboardUpdated(address indexed user, uint256 score, uint256 position);
    event MinLeaderboardScoreUpdated(uint256 newMinScore);

    constructor(address _serverSigner) Ownable(msg.sender) {
        serverSigner = _serverSigner;
    }

    // ------------------- Admin -------------------
    function updateServerSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        serverSigner = _newSigner;
        emit ServerSignerUpdated(_newSigner);
    }

    function setMinLeaderboardScore(uint256 _minScore) external onlyOwner {
        minLeaderboardScore = _minScore;
        emit MinLeaderboardScoreUpdated(_minScore);
    }

    // ------------------- Game Logic -------------------
    function startGame(uint256 fid) external returns (bool) {
        require(fid > 0, "Invalid FID");

        userGameInfo[msg.sender].fid = fid;
        userGameInfo[msg.sender].lastPlayed = block.timestamp;

        emit GameStarted(msg.sender, fid, block.timestamp);
        return true;
    }

    function storeScore(uint256 score) external {
        require(userGameInfo[msg.sender].fid != 0, "Start game first");
        
        GameInfo storage gameInfo = userGameInfo[msg.sender];
        gameInfo.score = score;
        gameInfo.lastPlayed = block.timestamp;
        gameInfo.totalGames++;

        // Update best score if this is a new record
        if (score > gameInfo.bestScore) {
            gameInfo.bestScore = score;
            // Update leaderboard if score qualifies
            if (score >= minLeaderboardScore) {
                _updateLeaderboard(msg.sender, score);
            }
        }

        emit ScoreStored(msg.sender, gameInfo.fid, score, block.timestamp);
    }

    function _updateLeaderboard(address player, uint256 score) internal {
        uint256 fid = userGameInfo[player].fid;
        uint256 insertPosition = leaderboard.length;
        bool isNewEntry = true;

        // Find insertion position or update existing entry
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                // Player already in leaderboard, update if score is better
                if (score > leaderboard[i].bestScore) {
                    leaderboard[i].bestScore = score;
                    leaderboard[i].lastPlayed = block.timestamp;
                    _sortLeaderboard();
                }
                isNewEntry = false;
                break;
            }
            if (score > leaderboard[i].bestScore && insertPosition == leaderboard.length) {
                insertPosition = i;
            }
        }

        // Add new entry if not already in leaderboard
        if (isNewEntry) {
            if (leaderboard.length < MAX_LEADERBOARD_SIZE) {
                leaderboard.push(LeaderboardEntry({
                    player: player,
                    fid: fid,
                    bestScore: score,
                    lastPlayed: block.timestamp
                }));
            } else if (insertPosition < leaderboard.length) {
                // Replace lowest entry if new score is higher
                leaderboard[leaderboard.length - 1] = LeaderboardEntry({
                    player: player,
                    fid: fid,
                    bestScore: score,
                    lastPlayed: block.timestamp
                });
            } else {
                // Score not high enough for leaderboard
                return;
            }
            _sortLeaderboard();
        }

        // Find and emit position
        uint256 position = _findLeaderboardPosition(player);
        emit LeaderboardUpdated(player, score, position);
    }

    function _sortLeaderboard() internal {
        // Simple bubble sort for small leaderboard (gas efficient for small arrays)
        uint256 n = leaderboard.length;
        for (uint256 i = 0; i < n - 1; i++) {
            for (uint256 j = 0; j < n - i - 1; j++) {
                if (leaderboard[j].bestScore < leaderboard[j + 1].bestScore) {
                    LeaderboardEntry memory temp = leaderboard[j];
                    leaderboard[j] = leaderboard[j + 1];
                    leaderboard[j + 1] = temp;
                }
            }
        }
    }

    function _findLeaderboardPosition(address player) internal view returns (uint256) {
        for (uint256 i = 0; i < leaderboard.length; i++) {
            if (leaderboard[i].player == player) {
                return i + 1; // 1-indexed position
            }
        }
        return 0;
    }

    // ------------------- View -------------------
    function getUserGameInfo(address user) external view returns (GameInfo memory) {
        return userGameInfo[user];
    }

    function getLeaderboard(uint256 limit) external view returns (LeaderboardEntry[] memory) {
        uint256 size = leaderboard.length < limit ? leaderboard.length : limit;
        LeaderboardEntry[] memory result = new LeaderboardEntry[](size);
        for (uint256 i = 0; i < size; i++) {
            result[i] = leaderboard[i];
        }
        return result;
    }

    function getLeaderboardLength() external view returns (uint256) {
        return leaderboard.length;
    }

    function getUserLeaderboardPosition(address user) external view returns (uint256) {
        return _findLeaderboardPosition(user);
    }

    function getTopScore() external view returns (uint256) {
        if (leaderboard.length > 0) {
            return leaderboard[0].bestScore;
        }
        return 0;
    }

    // ------------------- Reward Claim -------------------
    function claimTokenReward(
        address token,
        uint256 amount,
        bytes memory signature
    ) external nonReentrant {
        require(!usedSignatures[signature], "Signature already used");
        require(verifySignature(token, amount, signature), "Invalid signature");
        require(token != address(0), "Invalid token address");
        require(amount > 0, "Amount must be greater than 0");

        usedSignatures[signature] = true;
        
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient contract balance");
        require(tokenContract.transfer(msg.sender, amount), "Transfer failed");

        emit TokenRewarded(msg.sender, token, amount);
    }

    // Batch claim rewards (gas optimization for multiple rewards)
    function batchClaimTokenRewards(
        address[] calldata tokens,
        uint256[] calldata amounts,
        bytes[] calldata signatures
    ) external nonReentrant {
        require(tokens.length == amounts.length && amounts.length == signatures.length, "Array length mismatch");
        require(tokens.length > 0 && tokens.length <= 10, "Invalid batch size");

        for (uint256 i = 0; i < tokens.length; i++) {
            require(!usedSignatures[signatures[i]], "Signature already used");
            require(verifySignature(tokens[i], amounts[i], signatures[i]), "Invalid signature");
            require(tokens[i] != address(0), "Invalid token address");
            require(amounts[i] > 0, "Amount must be greater than 0");

            usedSignatures[signatures[i]] = true;
            
            IERC20 tokenContract = IERC20(tokens[i]);
            require(tokenContract.balanceOf(address(this)) >= amounts[i], "Insufficient contract balance");
            require(tokenContract.transfer(msg.sender, amounts[i]), "Transfer failed");

            emit TokenRewarded(msg.sender, tokens[i], amounts[i]);
        }
    }

    function verifySignature(
        address token,
        uint256 amount,
        bytes memory signature
    ) public view returns (bool) {
        bytes32 messageHash = keccak256(
            abi.encodePacked(msg.sender, token, amount)
        );
        bytes32 signedMessageHash = messageHash.toEthSignedMessageHash();
        address recoveredSigner = signedMessageHash.recover(signature);
        return recoveredSigner == serverSigner;
    }

    // ------------------- Emergency -------------------
    function withdrawToken(address token, uint256 amount) external onlyOwner nonReentrant {
        require(token != address(0), "Invalid token address");
        IERC20 tokenContract = IERC20(token);
        require(tokenContract.balanceOf(address(this)) >= amount, "Insufficient balance");
        require(tokenContract.transfer(owner(), amount), "Transfer failed");
    }

    function withdrawAllToken(address token) external onlyOwner nonReentrant {
        require(token != address(0), "Invalid token address");
        IERC20 tokenContract = IERC20(token);
        uint256 balance = tokenContract.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");
        require(tokenContract.transfer(owner(), balance), "Transfer failed");
    }

    // Emergency function to clear leaderboard (if needed)
    function clearLeaderboard() external onlyOwner {
        delete leaderboard;
    }
}
