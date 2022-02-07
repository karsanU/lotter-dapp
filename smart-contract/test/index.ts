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
import { BigNumber } from "ethers";

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
let owner: SignerWithAddress;
let manager1: SignerWithAddress;
let manager2: SignerWithAddress;
let addrs: SignerWithAddress[];

// helper functions
async function buy1TicketWithAddrs0() {
  bigBoyToken.connect(addrs[0]).approve(lottery.address, 25);
  await lottery.connect(addrs[0]).enter(1);
}

async function buy20TicketWithAddrs1() {
  bigBoyToken.connect(addrs[1]).approve(lottery.address, 25 * 20);
  await lottery.connect(addrs[1]).enter(20);
}

describe("Lottery Contract", function () {
  beforeEach(async () => {
    // get the accounts
    [owner, manager1, manager1, ...addrs] = await ethers.getSigners();
    // deploy token
    const Token = (await ethers.getContractFactory(
      "BigBoyToken"
    )) as BigBoyToken__factory;
    bigBoyToken = await Token.deploy();

    // deploy lotto
    const Lottery = (await ethers.getContractFactory(
      "Lottery"
    )) as Lottery__factory;
    lottery = await Lottery.deploy(bigBoyToken.address);

    // send some bbt to everyone
    const signers = await ethers.getSigners();
    signers.shift();
    signers.forEach(async (wallet: SignerWithAddress) => {
      await bigBoyToken.transfer(wallet.address, 10000);
    });
  });

  it("assigns the ERC20 token to be used for lotto at deployment", async () => {
    expect(await lottery.bbt()).to.equal(bigBoyToken.address);
  });

  it("sets managers", async () => {
    expect(await lottery.bbt()).to.equal(bigBoyToken.address);
  });

  it("has initial ticket price of 25", async () => {
    expect(await lottery.ticketPrice()).to.equal(25);
  });

  it("lets owner set a new ticket price", async () => {
    await lottery.setTicketPrice(50);
    expect(await lottery.ticketPrice()).to.equal(50);
  });

  it("doesn't let non-owner set ticket price", async () => {
    await expect(
      lottery.connect(addrs[0]).setTicketPrice(50)
    ).to.be.revertedWith("Sender is not owner.");
  });

  it("lets someone enter the lottery", async () => {
    await buy1TicketWithAddrs0();
    expect(await lottery.entries(0)).to.equal(addrs[0].address);
    await buy20TicketWithAddrs1();
    expect(await lottery.entries(20)).to.equal(addrs[1].address);
  });

  it("doesn't let someone enter the lottery if min req bbt not approved", async () => {
    bigBoyToken.connect(addrs[0]).approve(lottery.address, 24);
    await expect(lottery.connect(addrs[0]).enter(1)).to.be.revertedWith(
      "ERC20: transfer amount exceeds allowance"
    );
  });

  it("correctly sets the pool", async () => {
    await buy1TicketWithAddrs0();
    expect((await lottery.pricePool())._hex).to.equal(
      BigNumber.from(Math.floor((25 * 95) / 100))
    );
    await buy20TicketWithAddrs1();
    expect((await lottery.pricePool())._hex).to.equal(
      BigNumber.from(
        Math.floor((25 * 95) / 100) + Math.floor((25 * 20 * 95) / 100)
      )
    );
  });
  it("only lets manager/owner draw the lotto ", async () => {});
  it("", async () => {});
  it("", async () => {});
  it("", async () => {});
});
