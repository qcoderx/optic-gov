import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';

const NETWORK = 'testnet';
const SUI_CLIENT = new SuiClient({ url: getFullnodeUrl(NETWORK) });

// Contract addresses - update these with your deployed contract addresses
const CONTRACT_ADDRESSES = {
  PACKAGE_ID: process.env.VITE_SUI_PACKAGE_ID || '',
  PROJECT_REGISTRY: process.env.VITE_PROJECT_REGISTRY || '',
  MILESTONE_MANAGER: process.env.VITE_MILESTONE_MANAGER || ''
};

export class SuiService {
  private client: SuiClient;

  constructor() {
    this.client = SUI_CLIENT;
  }

  async getProjects(): Promise<any[]> {
    try {
      const response = await this.client.getOwnedObjects({
        owner: CONTRACT_ADDRESSES.PROJECT_REGISTRY,
        filter: {
          StructType: `${CONTRACT_ADDRESSES.PACKAGE_ID}::project::Project`
        },
        options: {
          showContent: true,
          showType: true
        }
      });

      return response.data.map(obj => obj.data?.content) || [];
    } catch (error) {
      console.error('Error fetching projects from SUI:', error);
      throw error;
    }
  }

  async createProject(walletSigner: any, projectData: {
    name: string;
    description: string;
    budget: number;
    contractor: string;
    location: { lat: number; lng: number };
  }): Promise<string> {
    try {
      const tx = new TransactionBlock();
      
      // Split gas coin to create payment coin
      const [coin] = tx.splitCoins(tx.gas, [tx.pure(projectData.budget * 1000000000)]); // Convert to MIST
      
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::optic_gov::create_project`,
        arguments: [
          coin, // Pass coin object, not number
          tx.pure(projectData.contractor)
        ]
      });

      const result = await walletSigner.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return result.digest;
    } catch (error) {
      console.error('Error creating project on SUI:', error);
      throw error;
    }
  }

  async submitMilestone(walletSigner: any, projectId: string, milestoneData: {
    evidence_url: string;
  }): Promise<string> {
    try {
      const tx = new TransactionBlock();
      
      // Match blockchain.move submit_evidence function signature
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::optic_gov::submit_evidence`,
        arguments: [
          tx.object(projectId),
          tx.pure(milestoneData.evidence_url) // Only send IPFS hash
        ]
      });

      const result = await walletSigner.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return result.digest;
    } catch (error) {
      console.error('Error submitting milestone to SUI:', error);
      throw error;
    }
  }

  async getProjectMilestones(projectId: string): Promise<any[]> {
    try {
      const response = await this.client.getObject({
        id: projectId,
        options: {
          showContent: true,
          showType: true
        }
      });

      const content = response.data?.content as any;
      return content?.fields?.milestones || [];
    } catch (error) {
      console.error('Error fetching milestones from SUI:', error);
      throw error;
    }
  }

  async releaseFunds(walletSigner: any, projectId: string, milestoneIndex: number): Promise<string> {
    // WARNING: This function requires OracleCap which only the backend holds
    // This should ONLY be called by the backend, not the frontend
    throw new Error('releaseFunds can only be called by the backend Oracle - use backend API instead');
  }
}

export const suiService = new SuiService();