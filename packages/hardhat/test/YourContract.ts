import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract } from "../typechain-types";

describe("YourContract", function () {
  let yourContract: YourContract;
  let owner: any;
  let addr1: any;
  let addr2: any;

  before(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();
    const yourContractFactory = await ethers.getContractFactory("YourContract");
    yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
    await yourContract.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await yourContract.owner()).to.equal(owner.address);
    });

    it("Should start with zero candidates", async function () {
      expect(await yourContract.getCandidatesCount()).to.equal(0);
    });
  });

  describe("Adding Candidates", function () {
    it("Owner should be able to add candidates", async function () {
      await yourContract.addCandidate("Alice");
      await yourContract.addCandidate("Bob");
      expect(await yourContract.getCandidatesCount()).to.equal(2);
    });

    it("Non-owner should not be able to add candidates", async function () {
      await expect(yourContract.connect(addr1).addCandidate("Charlie")).to.be.revertedWith("Not the Owner");
    });
  });

  describe("Voting", function () {
    it("Should allow a user to vote for a candidate", async function () {
      await yourContract.connect(addr1).vote(0); // Голос за Alice
      const candidate = await yourContract.getCandidate(0);
      expect(candidate.votes).to.equal(1);
    });

    it("Should not allow a user to vote twice", async function () {
      await expect(yourContract.connect(addr1).vote(1)).to.be.revertedWith("You have already voted");
    });

    it("Should not allow voting for a non-existent candidate", async function () {
      await expect(yourContract.connect(addr2).vote(5)).to.be.revertedWith("Invalid candidate index");
    });
  });

  describe("Determining Winner", function () {
    it("Should return the correct winner", async function () {
      // Голос addr2 за Bob
      await yourContract.connect(addr2).vote(1);
      const winner = await yourContract.getWinner();
      expect(winner.winnerIndex).to.equal(0); // Ожидаем Alice
      expect(winner.winnerVotes).to.equal(1);
    });

    it("Should handle tie correctly", async function () {
      // Добавим еще кандидата и сделаем ничью
      await yourContract.addCandidate("Charlie");
      await yourContract.connect(owner).vote(2); // Голос за Charlie
      const winner = await yourContract.getWinner();
      // В текущей реализации первый кандидат с максимальными голосами считается победителем
      expect(winner.winnerIndex).to.equal(0); // Ожидаем Alice
      expect(winner.winnerVotes).to.equal(1);
    });
  });
});
