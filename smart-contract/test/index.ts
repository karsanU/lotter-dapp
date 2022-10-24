/* eslint-disable camelcase */
import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  BigBoyToken,
  BigBoyToken__factory,
  Lottery,
  Lottery__factory,
} from "../typechain";
import { utils } from "ethers";

describe("BBT Token Contract", function () {
  it("should assign the total supply of tokens to the owner at deployment", async function () {
    const [owner] = await ethers.getSigners();
    // deploy
    const Token = await ethers.getContractFactory("BigBoyToken");
    const bigBoyToken = await Token.deploy();

    // validate
    const ownerBalance = await bigBoyToken.balanceOf(owner.address);
    expect(await bigBoyToken.totalSupply()).to.equal(ownerBalance);
  });
});

let bigBoyToken: BigBoyToken;
let lottery: Lottery;
let manager1: SignerWithAddress;
let manager2: SignerWithAddress;
let addrs: SignerWithAddress[];

// helper functions
async function buy1TicketWithAddrs(addressIndex: number) {
  bigBoyToken
    .connect(addrs[addressIndex])
    .approve(lottery.address, utils.parseEther("25"));
  await lottery.connect(addrs[addressIndex]).enter(1);
}

async function buy20TicketWithAddrs(addressIndex: number) {
  bigBoyToken
    .connect(addrs[addressIndex])
    .approve(lottery.address, utils.parseEther(String(25 * 20)));
  await lottery.connect(addrs[addressIndex]).enter(20);
}

async function increaseBlockTimeBy5mins() {
  await ethers.provider.send("evm_increaseTime", [60 * 5]);
}

describe("Lottery Contract", function () {
  beforeEach(async () => {
    // get the accounts
    const signers = await ethers.getSigners();
    signers.shift();
    [manager1, manager2, ...addrs] = signers;
    // deploy token
    const Token = (await ethers.getContractFactory(
      "BigBoyToken"
    )) as BigBoyToken__factory;
    bigBoyToken = await Token.deploy();
    await bigBoyToken.deployed();

    // deploy lotto
    const Lottery = (await ethers.getContractFactory(
      "Lottery"
    )) as Lottery__factory;
    lottery = await Lottery.deploy(bigBoyToken.address);
    await lottery.deployed();

    // set managers
    await lottery.setManager(true, manager1.address);
    await lottery.setManager(false, manager2.address);

    // send some bbt to everyone
    signers.forEach(async (wallet: SignerWithAddress) => {
      await bigBoyToken.transfer(wallet.address, utils.parseEther("10000"));
    });
  });

  it("assigns the ERC20 token to be used for lotto at deployment", async () => {
    expect(await lottery.bbt()).to.equal(bigBoyToken.address);
  });

  it("owner sets manager1 and manager2", async () => {
    expect(await lottery.managers(0)).to.equal(manager1.address);
    expect(await lottery.managers(1)).to.equal(manager2.address);
  });

  it("doesn't let non-owner change the managers", async () => {
    await expect(
      lottery.connect(addrs[0]).setManager(true, manager1.address)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("correctly sets token for pricePool", async () => {
    expect(await lottery.bbt()).to.equal(bigBoyToken.address);
  });

  it("has initial ticket price of 25", async () => {
    expect(await lottery.ticketPrice()).to.equal(utils.parseEther("25"));
  });

  it("lets owner set a new ticket price", async () => {
    await lottery.setTicketPrice(50);
    expect(await lottery.ticketPrice()).to.equal(utils.parseEther("50"));
  });

  it("doesn't let non-owner set ticket price", async () => {
    await expect(
      lottery.connect(addrs[0]).setTicketPrice(50)
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("lets someone enter the lottery", async () => {
    await buy1TicketWithAddrs(0);
    expect(await lottery.getEntry(0, 0)).to.equal(addrs[0].address);
    await buy20TicketWithAddrs(1);
    expect(await lottery.getEntry(0, 20)).to.equal(addrs[1].address);
  });

  it("doesn't let someone enter the lottery if min req bbt not approved", async () => {
    bigBoyToken
      .connect(addrs[0])
      .approve(lottery.address, utils.parseEther("24"));
    await expect(lottery.connect(addrs[0]).enter(1)).to.be.revertedWith(
      "ERC20: insufficient allowance"
    );
  });

  it("correctly sets the pricePool", async () => {
    await buy1TicketWithAddrs(0);
    expect((await lottery.pricePool())._hex).to.equal(utils.parseEther("25"));
    await buy20TicketWithAddrs(1);
    expect((await lottery.pricePool())._hex).to.equal(
      utils.parseEther(String(25 + 25 * 20))
    );
  });
  it("lets only manager/owner draw the lotto", async () => {
    await buy20TicketWithAddrs(0);
    await buy20TicketWithAddrs(1);
    await buy20TicketWithAddrs(2);
    increaseBlockTimeBy5mins();
    await expect(lottery.connect(addrs[0]).draw()).to.be.revertedWith(
      "Sender is not manager"
    );
    // manager 1 draws lotto
    await lottery.connect(manager1).draw();
    expect(await lottery.pricePool()).to.be.equal(0);
  });

  it("draw twice", async () => {
    await buy20TicketWithAddrs(0);
    await buy20TicketWithAddrs(1);
    await buy20TicketWithAddrs(3);
    increaseBlockTimeBy5mins();
    await lottery.connect(manager1).draw();
    await buy20TicketWithAddrs(0);
    await buy20TicketWithAddrs(1);
    await buy20TicketWithAddrs(2);
    increaseBlockTimeBy5mins();
    await lottery.connect(manager1).draw();
    expect(await lottery.pricePool()).to.be.equal(0);
    expect(await lottery.getEntry(0, 59)).to.equal(addrs[3].address);
    expect(await lottery.getEntry(1, 59)).to.equal(addrs[2].address);
    expect(await lottery.getEntry(1, 60)).to.equal(
      "0x0000000000000000000000000000000000000000"
    );
  });

  it("only allows lotto to be drawn 5 mins after the last draw", async () => {
    await buy20TicketWithAddrs(0);
    await buy20TicketWithAddrs(1);
    await buy20TicketWithAddrs(2);
    await expect(lottery.draw()).to.be.revertedWith("5 minutes has to pass.");
    increaseBlockTimeBy5mins();
    await lottery.draw();
    const someoneGotThePricePool = [0, 1, 2].some(async (index) => {
      const balance = await bigBoyToken.balanceOf(addrs[index].address);
      return balance === utils.parseEther(String((60 * 25 * 100) / 95));
    });
    expect(someoneGotThePricePool).to.equal(true);
  });
});
