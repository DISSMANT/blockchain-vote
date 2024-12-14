// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract YourContract {
    address public owner;
    bool public votingActive;

    struct Candidate {
        string name;
        uint votes;
    }

    Candidate[] public candidates;
    mapping(address => bool) public hasVoted;

    constructor(address _owner) {
        owner = _owner;
        votingActive = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the Owner");
        _;
    }

    function addCandidate(string memory _name) public onlyOwner {
        candidates.push(Candidate({name: _name, votes: 0}));
    }

    function empty(uint zabava) public view returns (Candidate memory)
    {
        return candidates[0];
    }

    function getCandidatesCount() public view returns (uint) {
        return candidates.length;
    }

    function getCandidate(uint index) public view returns (Candidate memory) {
        require(index < candidates.length, "Invalid candidate index");
        return candidates[index];
    }

    function getAllCandidates() public view returns (Candidate[] memory) {
        return candidates;
    }

    function vote(uint index) public {
        require(votingActive, "Voting has ended");
        require(!hasVoted[msg.sender], "You have already voted");
        require(index < candidates.length, "Invalid candidate index");
        candidates[index].votes += 1;
        hasVoted[msg.sender] = true;
    }

    function endVoting() public onlyOwner {
        require(votingActive, "Voting is already ended");
        votingActive = false;
    }

    function getWinner() public view returns (uint winnerIndex, uint winnerVotes) {
        require(candidates.length > 0, "No candidates");
        require(!votingActive, "Voting is still active");
        winnerIndex = 0;
        winnerVotes = candidates[0].votes;
        for (uint i = 1; i < candidates.length; i++) {
            if (candidates[i].votes > winnerVotes) {
                winnerVotes = candidates[i].votes;
                winnerIndex = i;
            }
        }
    }
}
