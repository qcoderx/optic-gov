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

  async createProject(projectData: {
    name: string;
    description: string;
    budget: number;
    contractor: string;
    location: { lat: number; lng: number };
  }): Promise<string> {
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::project::create_project`,
        arguments: [
          tx.pure(projectData.name),
          tx.pure(projectData.description),
          tx.pure(projectData.budget),
          tx.pure(projectData.contractor),
          tx.pure(projectData.location.lat),
          tx.pure(projectData.location.lng)
        ]
      });

      // This would need proper wallet integration
      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: Ed25519Keypair.generate(), // Replace with actual wallet
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

  async submitMilestone(projectId: string, milestoneData: {
    index: number;
    evidence_url: string;
    verification_result: any;
  }): Promise<string> {
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::milestone::submit_milestone`,
        arguments: [
          tx.object(projectId),
          tx.pure(milestoneData.index),
          tx.pure(milestoneData.evidence_url),
          tx.pure(JSON.stringify(milestoneData.verification_result))
        ]
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: Ed25519Keypair.generate(), // Replace with actual wallet
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

  async releaseFunds(projectId: string, milestoneIndex: number): Promise<string> {
    try {
      const tx = new TransactionBlock();
      
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.PACKAGE_ID}::payment::release_milestone_funds`,
        arguments: [
          tx.object(projectId),
          tx.pure(milestoneIndex)
        ]
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: Ed25519Keypair.generate(), // Replace with actual wallet
        options: {
          showEffects: true,
          showObjectChanges: true
        }
      });

      return result.digest;
    } catch (error) {
      console.error('Error releasing funds on SUI:', error);
      throw error;
    }
  }
}

export const suiService = new SuiService();