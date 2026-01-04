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
      throw error;
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
    // Submit evidence to Mantle blockchain first
    try {
      const { mantleService } = await import("./mantleService");

      if (!request.on_chain_id) {
        console.warn("⚠️ Warning: No on_chain_id provided. Skipping blockchain evidence submission.");
      } else {
        await mantleService.submitEvidence(
          Number(request.on_chain_id),
          request.milestone_index,
          request.video_url
        );
        console.log("✅ Evidence submitted to Mantle blockchain");
      }
    } catch (mantleError) {
      console.error(
        "❌ Failed to submit evidence to blockchain:",
        mantleError
      );
      throw new Error("Must submit evidence on-chain before verification");
    }

    // Now call backend verification
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