const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BlockHire", function () {
  let blockHire;
  let owner, client, freelancer, otherUser;
  
  const JOB_PAYMENT = ethers.parseEther("1.0"); // 1 ETH
  const PLATFORM_FEE_PERCENT = 2n;
  
  beforeEach(async function () {
    [owner, client, freelancer, otherUser] = await ethers.getSigners();
    
    const BlockHire = await ethers.getContractFactory("BlockHire");
    blockHire = await BlockHire.deploy();
    await blockHire.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await blockHire.owner()).to.equal(owner.address);
    });

    it("Should have 2% platform fee", async function () {
      expect(await blockHire.platformFeePercent()).to.equal(2n);
    });
  });

  describe("Create Job", function () {
    it("Should create a job with payment", async function () {
      const tx = await blockHire.connect(client).createJob(
        "Build Website",
        "Need a React website",
        "QmXyz123...",
        { value: JOB_PAYMENT }
      );
      
      await tx.wait();
      
      const job = await blockHire.getJob(1);
      expect(job.client).to.equal(client.address);
      expect(job.title).to.equal("Build Website");
      expect(job.status).to.equal(0n); // Open
    });

    it("Should lock funds in contract", async function () {
      await blockHire.connect(client).createJob(
        "Build Website",
        "Need a React website",
        "QmXyz123...",
        { value: JOB_PAYMENT }
      );
      
      const balance = await ethers.provider.getBalance(
        await blockHire.getAddress()
      );
      expect(balance).to.equal(JOB_PAYMENT);
    });

    it("Should fail without payment", async function () {
      await expect(
        blockHire.connect(client).createJob(
          "Build Website",
          "Description",
          "QmXyz123..."
        )
      ).to.be.revertedWith("Payment amount must be greater than 0");
    });
  });

  describe("Accept Job", function () {
    beforeEach(async function () {
      await blockHire.connect(client).createJob(
        "Build Website",
        "Description",
        "QmXyz123...",
        { value: JOB_PAYMENT }
      );
    });

    it("Should allow freelancer to accept", async function () {
      await blockHire.connect(freelancer).acceptJob(1);
      
      const job = await blockHire.getJob(1);
      expect(job.freelancer).to.equal(freelancer.address);
      expect(job.status).to.equal(1n); // InProgress
    });

    it("Should not allow client to accept own job", async function () {
      await expect(
        blockHire.connect(client).acceptJob(1)
      ).to.be.revertedWith("Client cannot accept own job");
    });
  });

  describe("Submit Work", function () {
    beforeEach(async function () {
      await blockHire.connect(client).createJob(
        "Build Website",
        "Description",
        "QmXyz123...",
        { value: JOB_PAYMENT }
      );
      await blockHire.connect(freelancer).acceptJob(1);
    });

    it("Should allow freelancer to submit work", async function () {
      await blockHire.connect(freelancer).submitWork(1, "QmDeliverable123...");
      
      const job = await blockHire.getJob(1);
      expect(job.deliverableIPFS).to.equal("QmDeliverable123...");
      expect(job.status).to.equal(2n); // Submitted
    });

    it("Should not allow non-freelancer to submit", async function () {
      await expect(
        blockHire.connect(otherUser).submitWork(1, "QmFake...")
      ).to.be.revertedWith("Only freelancer can call this");
    });
  });

  describe("Approve and Release", function () {
    beforeEach(async function () {
      await blockHire.connect(client).createJob(
        "Build Website",
        "Description",
        "QmXyz123...",
        { value: JOB_PAYMENT }
      );
      await blockHire.connect(freelancer).acceptJob(1);
      await blockHire.connect(freelancer).submitWork(1, "QmDeliverable123...");
    });

    it("Should release payment to freelancer", async function () {
      const freelancerBalanceBefore = await ethers.provider.getBalance(
        freelancer.address
      );
      
      await blockHire.connect(client).approveAndRelease(1);
      
      const freelancerBalanceAfter = await ethers.provider.getBalance(
        freelancer.address
      );
      
      // Freelancer should receive payment minus platform fee
      const expectedPayment = JOB_PAYMENT - (JOB_PAYMENT * PLATFORM_FEE_PERCENT / 100n);
      
      expect(freelancerBalanceAfter - freelancerBalanceBefore)
        .to.equal(expectedPayment);
    });

    it("Should update job status to Completed", async function () {
      await blockHire.connect(client).approveAndRelease(1);
      
      const job = await blockHire.getJob(1);
      expect(job.status).to.equal(3n); // Completed
    });
  });

  describe("Cancel Job", function () {
    it("Should refund client if job is open", async function () {
      await blockHire.connect(client).createJob(
        "Build Website",
        "Description",
        "QmXyz123...",
        { value: JOB_PAYMENT }
      );
      
      const clientBalanceBefore = await ethers.provider.getBalance(
        client.address
      );
      
      const tx = await blockHire.connect(client).cancelJob(1);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      
      const clientBalanceAfter = await ethers.provider.getBalance(
        client.address
      );
      
      // Client should receive full refund minus gas
      expect(clientBalanceAfter + gasUsed - clientBalanceBefore)
        .to.equal(JOB_PAYMENT);
    });
  });

  describe("Dispute", function () {
    beforeEach(async function () {
      await blockHire.connect(client).createJob(
        "Build Website",
        "Description",
        "QmXyz123...",
        { value: JOB_PAYMENT }
      );
      await blockHire.connect(freelancer).acceptJob(1);
      await blockHire.connect(freelancer).submitWork(1, "QmDeliverable123...");
    });

    it("Should allow client to raise dispute", async function () {
      await blockHire.connect(client).raiseDispute(1, "Work not matching requirements");
      
      const job = await blockHire.getJob(1);
      expect(job.status).to.equal(4n); // Disputed
      expect(job.disputeRaisedBy).to.equal(client.address);
    });

    it("Should allow owner to resolve in favor of freelancer", async function () {
      await blockHire.connect(client).raiseDispute(1, "Work not matching");
      
      const freelancerBalanceBefore = await ethers.provider.getBalance(
        freelancer.address
      );
      
      await blockHire.connect(owner).resolveDispute(1, true);
      
      const freelancerBalanceAfter = await ethers.provider.getBalance(
        freelancer.address
      );
      
      const expectedPayment = JOB_PAYMENT - (JOB_PAYMENT * PLATFORM_FEE_PERCENT / 100n);
      
      expect(freelancerBalanceAfter - freelancerBalanceBefore)
        .to.equal(expectedPayment);
    });
  });
});