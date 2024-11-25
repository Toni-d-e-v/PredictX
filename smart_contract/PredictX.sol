// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract PredictX is Ownable, ReentrancyGuard {
    enum Outcome { PENDING, A, B }
    enum MarketStatus { OPEN, CLOSED, RESOLVED }

    struct Market {
        string description;
        uint256 poolA;
        uint256 poolB;
        Outcome outcome;
        MarketStatus status;
        uint256 createdAt;
        uint256 endTime;
    }

    struct Bet {
        Outcome choice;
        uint256 amount;
        bool claimed;
    }

    mapping(uint256 => Market) public markets;
    mapping(uint256 => mapping(address => Bet)) public bets;
    uint256 public marketCounter;

    event MarketCreated(uint256 indexed marketId, string description, uint256 endTime);
    event BetPlaced(uint256 indexed marketId, address indexed bettor, Outcome choice, uint256 amount);
    event MarketResolved(uint256 indexed marketId, Outcome outcome);
    event PayoutClaimed(uint256 indexed marketId, address indexed bettor, uint256 amount);

    constructor() Ownable(msg.sender) {}

    function createMarket(string memory description, uint256 duration) external onlyOwner {
        require(duration > 0, "Duration must be positive");
        
        uint256 marketId = marketCounter++;
        uint256 endTime = block.timestamp + duration;
        
        markets[marketId] = Market({
            description: description,
            poolA: 0,
            poolB: 0,
            outcome: Outcome.PENDING,
            status: MarketStatus.OPEN,
            createdAt: block.timestamp,
            endTime: endTime
        });

        emit MarketCreated(marketId, description, endTime);
    }

    function placeBet(uint256 marketId, Outcome choice) external payable nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.OPEN, "Market is not open");
        require(block.timestamp < market.endTime, "Market has ended");
        require(choice == Outcome.A || choice == Outcome.B, "Invalid outcome choice");
        require(msg.value > 0, "Bet amount must be positive");

        // Update pools
        if (choice == Outcome.A) {
            market.poolA += msg.value;
        } else {
            market.poolB += msg.value;
        }

        // Record bet
        bets[marketId][msg.sender] = Bet({
            choice: choice,
            amount: msg.value,
            claimed: false
        });

        emit BetPlaced(marketId, msg.sender, choice, msg.value);
    }

    function resolveMarket(uint256 marketId, Outcome outcome) external onlyOwner {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.OPEN, "Market is not open");
        require(block.timestamp >= market.endTime, "Market has not ended yet");
        require(outcome == Outcome.A || outcome == Outcome.B, "Invalid outcome");

        market.outcome = outcome;
        market.status = MarketStatus.RESOLVED;

        emit MarketResolved(marketId, outcome);
    }

    function claimPayout(uint256 marketId) external nonReentrant {
        Market storage market = markets[marketId];
        require(market.status == MarketStatus.RESOLVED, "Market not resolved");
        
        Bet storage bet = bets[marketId][msg.sender];
        require(bet.amount > 0, "No bet placed");
        require(!bet.claimed, "Payout already claimed");
        require(bet.choice == market.outcome, "Bet on wrong outcome");

        uint256 totalPool = market.poolA + market.poolB;
        uint256 winningPool = (market.outcome == Outcome.A) ? market.poolA : market.poolB;
        
        // Calculate payout using proportional share of the total pool
        uint256 payout = (bet.amount * totalPool) / winningPool;
        bet.claimed = true;

        (bool success, ) = payable(msg.sender).call{value: payout}("");
        require(success, "Transfer failed");

        emit PayoutClaimed(marketId, msg.sender, payout);
    }

    function getMarketInfo(uint256 marketId) external view returns (
        string memory description,
        uint256 poolA,
        uint256 poolB,
        Outcome outcome,
        MarketStatus status,
        uint256 endTime
    ) {
        Market storage market = markets[marketId];
        return (
            market.description,
            market.poolA,
            market.poolB,
            market.outcome,
            market.status,
            market.endTime
        );
    }

    function getBetInfo(uint256 marketId, address bettor) external view returns (
        Outcome choice,
        uint256 amount,
        bool claimed
    ) {
        Bet storage bet = bets[marketId][bettor];
        return (bet.choice, bet.amount, bet.claimed);
    }
}