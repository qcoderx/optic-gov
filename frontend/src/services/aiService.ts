// AI Service for Gemini 2.5 Flash Integration
export interface VerificationResult {
  verified: boolean;
  confidence: number;
  reasoning: string;
  detected_elements: string[];
  compliance_score: number;
  timestamp: string;
  sui_transaction?: string;
  ethereum_transaction?: string;
}

export interface AIAnalysisRequest {
  video_url: string;
  milestone_criteria: string;
  project_id: number;
  milestone_index: number;
  on_chain_id?: string; // <--- FIX: Added field for SUI Object ID
}

export interface MilestoneGenerateRequest {
  project_description: string;
  total_budget: number;
}

export interface MilestoneGenerateResponse {
  milestones: string[];
}

class AIService {
  private baseUrl = "https://optic-gov.onrender.com";

  async verifyMilestone(
    request: AIAnalysisRequest
  ): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-milestone`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AI verification error:", error);
      throw error; // No mock fallback
    }
  }

  async uploadVideo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("video", file);

    const response = await fetch(`${this.baseUrl}/upload-video`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }

    const data = await response.json();
    return data.video_url || data.url;
  }

  async generateMilestones(request: MilestoneGenerateRequest): Promise<MilestoneGenerateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-milestones`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Milestone generation failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("AI milestone generation error:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();

// Real-time milestone verification
export async function verifyMilestoneWithBackend(
  request: AIAnalysisRequest
): Promise<VerificationResult> {
  try {
    // CRITICAL: Submit evidence to blockchain FIRST before backend verification
    // This ensures the audit trail is recorded before funds are released
    try {
      const { suiService } = await import("./suiService");
      const { walletService } = await import("./walletService");

      const walletSigner = walletService.getSigner();
      if (walletSigner) {
        // FIX: Use the actual SUI Object ID (on_chain_id) if available.
        // Fallback to project_id.toString() only if necessary, but that usually fails for SUI calls.
        const targetObjectId = request.on_chain_id || request.project_id.toString();

        if (!request.on_chain_id) {
            console.warn("⚠️ Warning: No on_chain_id provided. Using database ID, which may fail on-chain.");
        }

        await suiService.submitMilestone(
          walletSigner,
          targetObjectId, 
          {
            evidence_url: request.video_url,
          }
        );
        console.log("✅ Evidence submitted to blockchain first");
      } else {
        throw new Error("Wallet not connected - cannot submit evidence");
      }
    } catch (suiError) {
      console.error(
        "❌ CRITICAL: Failed to submit evidence to blockchain:",
        suiError
      );
      throw new Error("Must submit evidence on-chain before verification");
    }

    // Now call backend verification (which will release funds if successful)
    const response = await fetch(
      "https://optic-gov.onrender.com/verify-milestone",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(request),
      }
    );

    if (!response.ok) {
      throw new Error(`Verification failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Real-time verification failed:", error);
    throw error;
  }
}