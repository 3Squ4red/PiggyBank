const { ethers } = require("hardhat");
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

async function main() {
  const [owner] = await ethers.getSigners();

  const PiggyBankFactory = await ethers.getContractFactory("PiggyBankFactory");
  const factory = await PiggyBankFactory.deploy();

  await factory.deployed();

  console.log(`PiggyBankFactory deployed to ${factory.address}`);

  // Create a PiggyBank for vacation with 2 ETH
  await factory.createPiggyBank("vacation", {
    value: ethers.utils.parseEther("2.0"),
  });
  // Get the PiggyBank
  let piggyBank = factory.bankAddresses(owner.address, 0);
  piggyBank = new ethers.Contract(piggyBank, piggyABI, owner);

  console.log(
    `A PiggyBank for '${await piggyBank.getName()}', with ${ethers.utils.formatEther(
      await ethers.provider.getBalance(piggyBank.address)
    )} ETH is deployed at ${await piggyBank.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
