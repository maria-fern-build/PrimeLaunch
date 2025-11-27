import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const primeLaunchFactory = await deploy("PrimeLaunchFactory", {
    from: deployer,
    log: true,
  });

  console.log(`PrimeLaunchFactory contract:`, primeLaunchFactory.address);
};
export default func;
func.id = "deploy_primeLaunchFactory"; // id required to prevent reexecution
func.tags = ["PrimeLaunchFactory"];
