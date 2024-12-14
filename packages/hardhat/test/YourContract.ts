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

    it("Should set votingActive to true upon deployment", async function () {
      expect(await yourContract.votingActive()).to.equal(true);
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
    before(async function () {
      // Разворачиваем новый контракт для чистых тестов
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
      await yourContract.waitForDeployment();
      // Добавляем кандидатов
      await yourContract.addCandidate("Alice");
      await yourContract.addCandidate("Bob");
    });

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

    it("Should not allow voting after voting has ended", async function () {
      // Завершаем голосование
      await yourContract.endVoting();
      // Пытаемся проголосовать после завершения голосования
      await expect(yourContract.connect(addr2).vote(1)).to.be.revertedWith("Voting has ended");
    });
  });

  describe("Ending Voting", function () {
    before(async function () {
      // Разворачиваем новый контракт для чистых тестов
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
      await yourContract.waitForDeployment();
      // Добавляем кандидатов
      await yourContract.addCandidate("Alice");
      await yourContract.addCandidate("Bob");
    });

    it("Owner should be able to end voting", async function () {
      await yourContract.endVoting();
      expect(await yourContract.votingActive()).to.equal(false);
    });

    it("Non-owner should not be able to end voting", async function () {
      await expect(yourContract.connect(addr1).endVoting()).to.be.revertedWith("Not the Owner");
    });

    it("Should not allow ending voting twice", async function () {
      // Попытка завершить голосование второй раз
      await expect(yourContract.endVoting()).to.be.revertedWith("Voting is already ended");
    });
  });

  describe("Determining Winner", function () {
    before(async function () {
      // Разворачиваем новый контракт для чистых тестов
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
      await yourContract.waitForDeployment();
      // Добавляем кандидатов
      await yourContract.addCandidate("Alice");
      await yourContract.addCandidate("Bob");
      await yourContract.addCandidate("Charlie");
      // Голосуем
      await yourContract.connect(addr1).vote(0); // Alice: 1
      await yourContract.connect(addr2).vote(1); // Bob: 1
      await yourContract.connect(owner).vote(2); // Charlie: 1
      // Завершаем голосование
      await yourContract.endVoting();
    });

    it("Should return the correct winner when voting has ended", async function () {
      const winner = await yourContract.getWinner();
      // В текущей реализации первый кандидат с максимальными голосами считается победителем
      expect(winner.winnerIndex).to.equal(0); // Alice
      expect(winner.winnerVotes).to.equal(1);
    });

    it("Should handle tie correctly", async function () {
      // Добавляем новых кандидатов и голосуем за них для создания ничьей
      // Разворачиваем новый контракт для чистых тестов
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
      await yourContract.waitForDeployment();
      // Добавляем кандидатов
      await yourContract.addCandidate("Alice");
      await yourContract.addCandidate("Bob");
      // Голосуем
      await yourContract.connect(addr1).vote(0); // Alice: 1
      await yourContract.connect(addr2).vote(1); // Bob: 1
      // Завершаем голосование
      await yourContract.endVoting();
      const winner = await yourContract.getWinner();
      // В текущей реализации первый кандидат с максимальными голосами считается победителем
      expect(winner.winnerIndex).to.equal(0); // Alice
      expect(winner.winnerVotes).to.equal(1);
    });

    it("Should not allow determining winner while voting is active", async function () {
      // Разворачиваем новый контракт для чистых тестов
      const yourContractFactory = await ethers.getContractFactory("YourContract");
      yourContract = (await yourContractFactory.deploy(owner.address)) as YourContract;
      await yourContract.waitForDeployment();
      // Добавляем кандидатов и голосуем
      await yourContract.addCandidate("Alice");
      await yourContract.addCandidate("Bob");
      await yourContract.connect(addr1).vote(0);
      await yourContract.connect(addr2).vote(1);
      // Попытка определить победителя до завершения голосования
      await expect(yourContract.getWinner()).to.be.revertedWith("Voting is still active");
    });
  });
});
