//SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.15;

contract PiggyBank {
    address public immutable owner;
    bytes private name;

    function getName() external view returns (string memory _name) {
        _name = string(name);
    }

    event Deposit(uint indexed amount);
    event Withdraw(uint indexed amount);

    modifier ownerOnly() {
        require(msg.sender == owner, "caller is not owner");
        _;
    }

    modifier zeroAmount() {
        require(msg.value > 0, "deposit amount is 0");
        _;
    }

    constructor(address _owner, bytes memory _name) payable zeroAmount {
        owner = _owner;
        name = _name;
    }

    receive() external payable zeroAmount {
        emit Deposit(msg.value);
    }

    function withdraw(address factory) external ownerOnly {
        emit Withdraw(address(this).balance);
        PiggyBankFactory(factory).updateDeleteState(owner, this);
        selfdestruct(payable(owner));
    }
}

contract PiggyBankFactory {
    // Maps the owner address to piggybanks which are mapped again to whether they are deleted or not
    mapping(address => mapping(PiggyBank => bool)) public piggyBanks;
    // Maps an owner to his piggy banks
    mapping(address => PiggyBank[]) public bankAddresses;

    function createPiggyBank(string calldata name) external payable {
        require(msg.value > 0, "initial amount is 0");

        PiggyBank piggyBank = new PiggyBank{value: msg.value}(
            msg.sender,
            bytes(name)
        );
        piggyBanks[msg.sender][piggyBank] = false;
        bankAddresses[msg.sender].push(piggyBank);
    }

    function getNoOfPiggyBanks() external view returns (uint length) {
        return bankAddresses[msg.sender].length;
    }

    // This will be called by the PiggyBank contract only just before deleting the contract
    function updateDeleteState(address owner, PiggyBank piggyBank) external {
        require(msg.sender == address(piggyBank), "caller is not a piggy bank");
        piggyBanks[owner][piggyBank] = true;
    }
}
