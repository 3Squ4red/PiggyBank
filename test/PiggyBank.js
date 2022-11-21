const { expect } = require("chai");
const piggyABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "_owner",
        type: "address",
      },
      {
        internalType: "bytes",
        name: "_name",
        type: "bytes",
      },
    ],
    stateMutability: "payable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Deposit",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "Withdraw",
    type: "event",
  },
  {
    inputs: [],
    name: "getName",
    outputs: [
      {
        internalType: "string",
        name: "_name",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "factory",
        type: "address",
      },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    stateMutability: "payable",
    type: "receive",
  },
];

describe("PiggyBank", async () => {
  let accounts, factory, piggyBank;

  before(async () => {
    // Deploy the PiggyBankFactory contract
    const Factory = await ethers.getContractFactory("PiggyBankFactory");
    factory = await Factory.deploy();
    accounts = await ethers.getSigners();
  });

  describe("Creating piggy bank", () => {
    it("should revert while creating a piggy bank with zero balance", async () => {
      await expect(factory.createPiggyBank("vacation")).to.revertedWith(
        "initial amount is 0"
      );
    });
    it("should create a piggy bank with correct name and owner", async () => {
      await factory.createPiggyBank("vacation", {
        value: ethers.utils.parseEther("2.0"),
      });
      piggyBank = await factory.bankAddresses(accounts[0].address, 0);
      piggyBank = new ethers.Contract(piggyBank, piggyABI, accounts[0]);

      expect(await piggyBank.owner()).to.equal(accounts[0].address);
      expect(await piggyBank.getName()).to.equal("vacation");
    });
  });

  describe("Depositing", () => {
    it("should revert if 0 amount is deposited in piggy bank", async () => {
      await expect(
        accounts[5].sendTransaction({ to: piggyBank.address, value: 0 })
      ).to.revertedWith("deposit amount is 0");
    });
    it("should deposit 2 ETH to the piggy bank and emit Deposit event", async () => {
      await expect(
        accounts[2].sendTransaction({
          to: piggyBank.address,
          value: ethers.utils.parseEther("2.0"),
        })
      )
        .to.emit(piggyBank, "Deposit")
        .withArgs(ethers.utils.parseEther("2.0"));
      expect(await ethers.provider.getBalance(piggyBank.address)).to.equal(
        ethers.utils.parseEther("4.0")
      );
    });
  });

  describe("Withdrawing", () => {
    let bankBalance;
    it("should not let someone else withdraw from the PiggyBank", async () => {
      await expect(
        piggyBank.connect(accounts[1]).withdraw(factory.address)
      ).to.revertedWith("caller is not owner");
    });

    it("should not let someone call the updateDeleteState()", async () => {
      await expect(
        factory.updateDeleteState(accounts[0].address, piggyBank.address)
      ).to.revertedWith("caller is not a piggy bank");
    });

    it("should let the owner withdraw his funds", async () => {
      bankBalance = await ethers.provider.getBalance(piggyBank.address);
      await expect(piggyBank.withdraw(factory.address))
        .to.emit(piggyBank, "Withdraw")
        .withArgs(bankBalance);
    });
    it("should update the deleted state of the piggy bank", async () => {
      expect(
        await factory.piggyBanks(accounts[0].address, piggyBank.address)
      ).to.equal(true);
    });
  });
});

/**
 * Should revert with "initial amount is 0" while creating a piggybank with zero amount
 * Create a piggy bank and with correct name and owner
 * Should revert with "deposit amount is 0" if 0 ETH is sent to a piggybank
 * Update the balance of the PiggyBank after sending 2  ETH - Also emit the Deposit(amount) event while depositing
 * Should not let someone else withdraw from the PiggyBank
 * Should not let someone call the updateDeleteState(owner,piggyBank) function
 * Should let the owner withdraw from his own PiggyBank - also emit the Withdraw(amount) event while withdrawing - the owner must receive all his funds
 * The deleted state must be true after withdrawing
 */
