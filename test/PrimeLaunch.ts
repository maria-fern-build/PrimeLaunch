import { expect } from "chai";
import { ethers } from "hardhat";
import { PrimeLaunchFactory, PrimeLaunchToken } from "../types";

describe("PrimeLaunchFactory", function () {
  let factory: PrimeLaunchFactory;

  beforeEach(async function () {
    const factoryContract = await ethers.getContractFactory("PrimeLaunchFactory");
    factory = (await factoryContract.deploy()) as PrimeLaunchFactory;
  });

  it("creates confidential tokens with the default supply", async function () {
    const [creator] = await ethers.getSigners();

    const tx = await factory.connect(creator).createToken("Prime USDT", "pUSDT");
    await tx.wait();

    const tokenInfo = await factory.getToken(0);
    expect(tokenInfo.name).to.equal("Prime USDT");
    expect(tokenInfo.symbol).to.equal("pUSDT");
    expect(tokenInfo.creator).to.equal(creator.address);
    expect(tokenInfo.initialSupply).to.equal(10_000_000_000);

    const token = (await ethers.getContractAt("PrimeLaunchToken", tokenInfo.token)) as PrimeLaunchToken;
    const creatorBalance = await token.confidentialBalanceOf(creator.address);
    expect(creatorBalance).to.not.equal(ethers.ZeroHash);
  });

  it("allows any user to freemint additional supply", async function () {
    const [, user] = await ethers.getSigners();

    await factory.createToken("Prime ETH", "pETH");
    const tokenInfo = await factory.getToken(0);
    const token = (await ethers.getContractAt("PrimeLaunchToken", tokenInfo.token)) as PrimeLaunchToken;

    await token.connect(user).freemint(5_000);
    const userBalance = await token.confidentialBalanceOf(user.address);
    expect(userBalance).to.not.equal(ethers.ZeroHash);
  });
});
