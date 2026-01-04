import { ethers } from 'ethers';

const MANTLE_CHAIN_ID = 5003;
const MANTLE_RPC_URL = 'https://rpc.sepolia.mantle.xyz';
const CONTRACT_ADDRESS = '0x25b4C5e58BdF3124095aD925fd480eD5D17e9e64';

const CONTRACT_ABI = [
  "function createProject(address _contractor, uint256[] calldata _milestoneAmounts, string[] calldata _milestoneDescriptions) external payable returns (uint256)",
  "function releaseMilestone(uint256 _projectId, uint256 _milestoneIndex, bool _verdict) external",
  "function submitEvidence(uint256 _projectId, uint256 _milestoneIndex, string _ipfsHash) external",
  "function getMilestone(uint256 _projectId, uint256 _index) external view returns (tuple(string description, uint256 amount, bool isCompleted, bool isReleased, string evidenceIpfsHash))",
  "function projects(uint256) external view returns (address funder, address contractor, uint256 totalBudget, uint256 fundsReleased, uint256 milestoneCount)",
  "event ProjectCreated(uint256 indexed projectId, address indexed funder, address indexed contractor, uint256 budget)"
];

class MantleService {
  private provider: ethers.JsonRpcProvider;
  private contract: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(MANTLE_RPC_URL);
    this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
  }

  async connectWallet(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send('eth_requestAccounts', []);
    
    const network = await provider.getNetwork();
    if (Number(network.chainId) !== MANTLE_CHAIN_ID) {
      await this.switchToMantle();
    }

    return accounts[0];
  }

  private async switchToMantle() {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${MANTLE_CHAIN_ID.toString(16)}` }],
      });
    } catch (error: any) {
      if (error.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${MANTLE_CHAIN_ID.toString(16)}`,
            chainName: 'Mantle Sepolia Testnet',
            nativeCurrency: { name: 'MNT', symbol: 'MNT', decimals: 18 },
            rpcUrls: [MANTLE_RPC_URL],
            blockExplorerUrls: ['https://explorer.sepolia.mantle.xyz']
          }],
        });
      } else {
        throw error;
      }
    }
  }

  async createProject(
    contractorAddress: string,
    milestoneAmounts: string[],
    milestoneDescriptions: string[],
    totalBudgetMNT: string
  ): Promise<{ projectId: number; txHash: string }> {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const totalBudgetWei = ethers.parseEther(totalBudgetMNT);
    
    const tx = await contract.createProject(
      contractorAddress,
      milestoneAmounts,
      milestoneDescriptions,
      { value: totalBudgetWei }
    );

    const receipt = await tx.wait();
    
    const event = receipt.logs
      .map((log: any) => {
        try {
          return contract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((e: any) => e && e.name === 'ProjectCreated');

    if (!event) {
      throw new Error('ProjectCreated event not found');
    }

    return {
      projectId: Number(event.args.projectId),
      txHash: receipt.hash
    };
  }

  async submitEvidence(projectId: number, milestoneIndex: number, ipfsHash: string): Promise<string> {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

    const tx = await contract.submitEvidence(projectId, milestoneIndex, ipfsHash);
    const receipt = await tx.wait();
    
    return receipt.hash;
  }

  async getProjectState(projectId: number) {
    const projectData = await this.contract.projects(projectId);
    return {
      funder: projectData[0],
      contractor: projectData[1],
      totalBudget: ethers.formatEther(projectData[2]),
      fundsReleased: ethers.formatEther(projectData[3]),
      milestoneCount: Number(projectData[4])
    };
  }
}

export const mantleService = new MantleService();
