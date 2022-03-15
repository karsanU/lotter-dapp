//SPDX-License-Identifier: Unlicense

pragma solidity ^0.8.2;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EntriesMapping {
    mapping(uint256 => address) public entries;

    function set(uint256 index, address addrs) public {
        entries[index] = addrs;
    }

    function get(uint256 index) public view returns (address) {
        return entries[index];
    }
}

contract Lottery {
    address payable public owner;
    IERC20 public bbt;
    address[2] public managers;
    uint256 public totalEntries = 0;
    EntriesMapping entries = new EntriesMapping();
    uint256 public ticketPrice;
    uint256 public pricePool;
    uint256 public lastDrawTime;

    constructor(IERC20 token) {
        owner = payable(msg.sender);
        bbt = token;
        ticketPrice = 25 ether;
        lastDrawTime = block.timestamp;
    }

    function setManager(bool firstManager, address newMaanagerAddress)
        public
        ownerAcess
    {
        if (firstManager) {
            managers[0] = newMaanagerAddress;
        } else {
            managers[1] = newMaanagerAddress;
        }
    }

    function setTicketPrice(uint256 _ticketPrice) public ownerAcess {
        ticketPrice = _ticketPrice * 1 ether;
    }

    function enter(uint256 _totalTikets) public payable {
        require(_totalTikets > 0, "Must by atleast one tiket.");
        /// transfer the tokens to lottery contract
        bbt.transferFrom(msg.sender, address(this), ticketPrice * _totalTikets);
        /// add tokens to the current pool
        pricePool = pricePool + (ticketPrice * _totalTikets);
        /// enter the user _totalTikets number of times
        for (uint256 i = totalEntries; i < totalEntries + _totalTikets; i++) {
            entries.set(i, msg.sender);
        }
        totalEntries = totalEntries + _totalTikets;
    }

    function getEntry(uint256 index) public view returns (address) {
        return entries.get(index);
    }

    function draw() public fiveMinsPassed managerAcess {
        // pick the sudo winner
        require(totalEntries > 0, "No one entered");
        uint256 randomIndex = random() % totalEntries;
        address _winner = entries.get(randomIndex);
        // set the last drawn ltiem
        entries = new EntriesMapping();
        lastDrawTime = block.timestamp;
        // send the coind to the winner after 5% maintaiance fee
        totalEntries = 0;
        bbt.transfer(_winner, (pricePool * 95) / 100);
        // reset pricePool
        pricePool = 0;
    }

    function random() private view returns (uint256) {
        return
            uint256(
                keccak256(
                    abi.encodePacked(
                        block.difficulty,
                        block.timestamp,
                        totalEntries
                    )
                )
            );
    }

    modifier ownerAcess() {
        require(msg.sender == owner, "Sender is not owner.");
        _;
    }

    modifier managerAcess() {
        require(
            msg.sender == owner ||
                managers[0] == msg.sender ||
                managers[1] == msg.sender,
            "Sender is not manager"
        );
        _;
    }

    modifier fiveMinsPassed() {
        require(
            lastDrawTime + 5 minutes < block.timestamp,
            "5 minutes has to pass."
        );
        _;
    }
}
