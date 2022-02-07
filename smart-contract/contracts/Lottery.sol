//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "hardhat/console.sol";

contract Lottery {
    address payable public owner;
    IERC20 public bbt;
    address[2] public mangers;
    address[] public entries;
    uint256 public ticketPrice;
    uint256 public pricePool;
    uint256 public lastDarwTime;

    constructor(IERC20 token) {
        console.log("Deploying Lotterty. Owner: ", msg.sender);
        owner = payable(msg.sender);
        bbt = token;
        ticketPrice = 25;
        lastDarwTime = block.timestamp;
    }

    function setManger(bool firstManager, address newMaanagerAddress)
        public
        ownerAcess
    {
        if (firstManager) {
            mangers[0] = newMaanagerAddress;
        } else {
            mangers[1] = newMaanagerAddress;
        }
    }

    function setTicketPrice(uint256 _ticketPrice) public ownerAcess {
        ticketPrice = _ticketPrice;
    }

    function enter(uint256 _totalTikets) public payable {
        require(_totalTikets > 0, "Must by atleast one tiket.");
        /// transfer the tokens to lottery contract
        bbt.transferFrom(msg.sender, address(this), ticketPrice * _totalTikets);
        /// add tokens to the current pool
        pricePool = pricePool + ((ticketPrice * _totalTikets * 95) / 100);
        /// enter the user _totalTikets number of times
        for (uint256 i = 0; i < _totalTikets; i++) {
            entries.push(msg.sender);
        }
    }

    function draw() public fiveMinsPassed managerAcess {
        uint256 index = random() % entries.length;
        address _winner = (entries[index]);
        entries = new address payable[](0);
        bbt.transfer(_winner, pricePool);
    }

    modifier ownerAcess() {
        require(msg.sender == owner, "Sender is not owner.");
        _;
    }

    modifier managerAcess() {
        require(
            msg.sender == owner ||
                mangers[0] == msg.sender ||
                mangers[1] == msg.sender,
            "Sender is not manager"
        );
        _;
    }

    function random() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(block.difficulty, block.timestamp, entries)
                )
            );
    }

    modifier fiveMinsPassed() {
        require(
            lastDarwTime + 5 minutes < block.timestamp,
            "5 minutes has to pass."
        );
        _;
    }
}
