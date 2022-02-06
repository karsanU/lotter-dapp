import { expect } from "chai";
import { ethers } from "hardhat";

describe("BBT Token Contract", function () {
  it("Deployment should assign the total supply of tokens to the owner", async function () {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");

    const hardhatToken = await Token.deploy();

    const ownerBalance = await hardhatToken.balanceOf(owner.address);
    expect(await hardhatToken.totalSupply()).to.equal(ownerBalance);
  });
});

describe("Lottery Contract", function () {
  it("Should return the new greeting once it's changed", async function () {
    const Lottery = await ethers.getContractFactory("Lottery");
    const lottery = await Lottery.deploy("Hello, world!");
    await lottery.deployed();

    expect(await lottery.greet()).to.equal("Hello, world!");

    const setGreetingTx = await lottery.setGreeting("Hola, mundo!");

    // wait until the transaction is mined
    await setGreetingTx.wait();

    expect(await lottery.greet()).to.equal("Hola, mundo!");
  });
});


