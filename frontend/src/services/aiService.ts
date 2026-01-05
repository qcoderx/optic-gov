// aiService.ts
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

/**
 * Matches the VerificationResponse model in main.py
 */
export interface VerificationResult {
  verified: boolean;
  confidence_score: number;
  reasoning: string;
  mantle_transaction?: string;  // The Hash
  primary_chain?: string;       // To determine the URL base
  error?: string;
}
/**
 * Matches the VerificationRequest model in main.py
 */
export interface AIAnalysisRequest {
  video_url: string;
  milestone_criteria: string;
  project_id: number;
  milestone_index: number; // Backend uses this for ordering/payouts
}

export interface MilestoneGenerateRequest {
  project_description: string;
  total_budget: number;
}

export interface MilestoneGenerateResponse {
  milestones: string[];
}

class AIService {
  private baseUrl = API_BASE_URL;

  /**
   * Uploads evidence video to the backend
   */
  async uploadVideo(file: File, onProgress: (pct: number) => void): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      const formData = new FormData();
      formData.append("video", file);

      // Track actual byte upload progress
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          // Scale 0-100% upload to 0-60% of UI progress bar
          onProgress(Math.round(percent * 0.2));
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          const res = JSON.parse(xhr.response);
          resolve(res.video_url);
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.open("POST", `${this.baseUrl}/upload-video`);
      xhr.send(formData);
    });
  }

  /**
   * Calls the AI Oracle for verification
   */
  async verifyMilestone(request: AIAnalysisRequest): Promise<VerificationResult> {
    const response = await fetch(`${this.baseUrl}/verify-milestone`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "AI Oracle verification failed");
    }

    return await response.json();
  }

  async generateMilestones(request: MilestoneGenerateRequest): Promise<MilestoneGenerateResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/generate-milestones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) throw new Error(`Milestone generation failed`);
      return await response.json();
    } catch (error) {
      console.error("AI milestone generation error:", error);
      throw error;
    }
  }
}

export const aiService = new AIService();