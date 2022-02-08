// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // deploy token
  const Token = await ethers.getContractFactory("BigBoyToken");
  const bigBoyToken = await Token.deploy();
  await bigBoyToken.deployed();
  console.log("Token deployed to:", bigBoyToken.address);

  // deploy lotto
  const Lottery = await ethers.getContractFactory("Lottery");
  const lottery = await Lottery.deploy(bigBoyToken.address);
  await lottery.deployed();
  console.log("Lottery deployed to:", lottery.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
