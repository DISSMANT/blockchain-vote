//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

contract YourContract {
    address public immutable owner;

    struct Candidate {
        string name;
        uint voteCount;
    }

    Candidate[] public candidates;

    mapping(address => bool) public hasVoted;

    event CandidateAdded(address indexed addedBy, string candidateName);
    event Voted(address indexed voter, uint candidateIndex);

    constructor(address _owner) {
        owner = _owner;
    }

    modifier isOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    /**
     * Добавление кандидатов — только для владельца
     */
    function addCandidate(string memory _name) public isOwner {
        candidates.push(Candidate({
            name: _name,
            voteCount: 0
        }));

        emit CandidateAdded(msg.sender, _name);
    }

    /**
     * Голосование за кандидата по индексу
     */
    function vote(uint candidateIndex) public {
        require(candidateIndex < candidates.length, "Invalid candidate index");
        require(!hasVoted[msg.sender], "You have already voted");

        candidates[candidateIndex].voteCount += 1;
        hasVoted[msg.sender] = true;

        emit Voted(msg.sender, candidateIndex);
    }

    /**
     * Получение количества кандидатов
     */
    function getCandidatesCount() public view returns (uint) {
        return candidates.length;
    }

    /**
     * Получение информации о кандидате по индексу
     */
    function getCandidate(uint index) public view returns (string memory name, uint votes) {
        require(index < candidates.length, "Invalid index");
        Candidate memory c = candidates[index];
        return (c.name, c.voteCount);
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    /**
     * Определение победителя
     */
    function getWinner() public view returns (uint winnerIndex, uint winnerVotes) {
        require(candidates.length > 0, "No candidates");
        uint maxVotes = 0;
        uint index = 0;

        for (uint i = 0; i < candidates.length; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                index = i;
            }
        }

        return (index, maxVotes);
    }

    /**
     * Функция вывода всех средств только для владельца
     */
    function withdraw() public isOwner {
        (bool success, ) = owner.call{ value: address(this).balance }("");
        require(success, "Failed to send Ether");
    }

    /**
     * Функция, позволяющая контракту принимать ETH
     */
    receive() external payable {}
}
