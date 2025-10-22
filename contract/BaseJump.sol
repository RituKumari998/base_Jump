// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract BaseJump is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct GameInfo {
        uint256 fid;         // Farcaster ID
        uint256 score;       // Latest recorded score
        uint256 lastPlayed;  // Timestamp of last game
    }

    // Mapping to track used signatures
    mapping(bytes => bool) public usedSignatures;

    // Server's public key for signature verification
    address public serverSigner;

    // Mapping of user addresses to their game info
    mapping(address => GameInfo) public userGameInfo;

    event TokenRewarded(address indexed user, address indexed token, uint256 amount);
    event ServerSignerUpdated(address indexed newSigner);
    event GameStarted(address indexed user, uint256 fid, uint256 timestamp);
    event ScoreStored(address indexed user, uint256 fid, uint256 score, uint256 timestamp);

    constructor(address _serverSigner) Ownable(msg.sender) {
        serverSigner = _serverSigner;
    }

    // ------------------- Admin -------------------
    function updateServerSigner(address _newSigner) external onlyOwner {
        require(_newSigner != address(0), "Invalid signer address");
        serverSigner = _newSigner;
        emit ServerSignerUpdated(_newSigner);
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
        userGameInfo[msg.sender].score = score;
        userGameInfo[msg.sender].lastPlayed = block.timestamp;

        emit ScoreStored(msg.sender, userGameInfo[msg.sender].fid, score, block.timestamp);
    }

    // ------------------- View -------------------
    function getUserGameInfo(address user) external view returns (GameInfo memory) {
        return userGameInfo[user];
    }

    // ------------------- Reward Claim -------------------
    function claimTokenReward(
        address token,
        uint256 amount,
        bytes memory signature
    ) external {
        require(!usedSignatures[signature], "Signature already used");
        require(verifySignature(token, amount, signature), "Invalid signature");

        usedSignatures[signature] = true;
        require(IERC20(token).transfer(msg.sender, amount), "Transfer failed");

        emit TokenRewarded(msg.sender, token, amount);
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
    function withdrawToken(address token, uint256 amount) external onlyOwner {
        require(IERC20(token).transfer(owner(), amount), "Transfer failed");
    }
}
