import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("prime-launch:address", "Prints the PrimeLaunchFactory address").setAction(async (_args, hre) => {
  const deployment = await hre.deployments.get("PrimeLaunchFactory");
  console.log(`PrimeLaunchFactory deployed at ${deployment.address}`);
});

task("prime-launch:create", "Deploys a new confidential token")
  .addParam("name", "Token name")
  .addParam("symbol", "Token symbol")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const factoryDeployment = await deployments.get("PrimeLaunchFactory");
    const factory = await ethers.getContractAt("PrimeLaunchFactory", factoryDeployment.address);

    const tx = await factory.createToken(taskArguments.name as string, taskArguments.symbol as string);
    console.log(`Creating token... tx: ${tx.hash}`);
    await tx.wait();
    console.log(`Token created successfully.`);
  });

task("prime-launch:list", "Lists all deployed confidential tokens").setAction(async (_args, hre) => {
  const { ethers, deployments } = hre;
  const factoryDeployment = await deployments.get("PrimeLaunchFactory");
  const factory = await ethers.getContractAt("PrimeLaunchFactory", factoryDeployment.address);

  const tokens = await factory.getAllTokens();
  if (tokens.length === 0) {
    console.log("No tokens deployed yet");
    return;
  }

  tokens.forEach((token, index) => {
    console.log(`#${index} ${token.name} (${token.symbol}) -> ${token.token} | creator: ${token.creator}`);
  });
});
