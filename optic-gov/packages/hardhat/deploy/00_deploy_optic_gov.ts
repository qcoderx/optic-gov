import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const deployOpticGov: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { getNamedAccounts, deployments, getChainId } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();
    const chainId = await getChainId();

    let oracleAddress: string;

    if (chainId === "31337") { 
        // Hardhat Local Dev Chain: Use a known local account (Account #4) for testing
        oracleAddress = "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"; 
        console.log(`[Local Dev] Oracle Address set to: ${oracleAddress}`);
    } else {
        // Sepolia (Testnet) -> The production path
        // Pull the dedicated AI Oracle address from the environment variable
        oracleAddress = process.env.ORACLE_WALLET_ADDRESS || deployer; 
        console.warn(`[${chainId}] WARNING: Oracle Address set to: ${oracleAddress}. Verify this is the Backend's Wallet.`);
    }

    await deploy("OpticGov", {
        from: deployer,
        // The constructor argument for OpticGov(address _oracleAddress)
        args: [oracleAddress], 
        log: true,
        waitConfirmations: 5, 
    });
};

export default deployOpticGov;
deployOpticGov.tags = ["OpticGov"];