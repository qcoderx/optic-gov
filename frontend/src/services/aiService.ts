// AI Service for Gemini 2.5 Flash Integration
export interface VerificationResult {
  verified: boolean;
  confidence: number;
  reasoning: string;
  detected_elements: string[];
  compliance_score: number;
  timestamp: string;
}

export interface AIAnalysisRequest {
  video_url: string;
  milestone_criteria: string;
  project_id: number;
  milestone_index: number;
}

class AIService {
  private baseUrl = 'https://optic-gov.onrender.com';

  async verifyMilestone(request: AIAnalysisRequest): Promise<VerificationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-milestone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Verification failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('AI verification error:', error);
      throw error; // No mock fallback
    }
  }

  async uploadVideo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('video', file);
    
    const response = await fetch(`${this.baseUrl}/upload-video`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status}`);
    }
    
    const data = await response.json();
    return data.video_url || data.url;
  }

  private getMockVerification(): VerificationResult {
    // This method is removed - no mock data allowed
    throw new Error('Mock verification disabled - use real backend only');
  }

}

export const aiService = new AIService();

// Real-time milestone verification
export async function verifyMilestoneWithBackend(request: AIAnalysisRequest): Promise<VerificationResult> {
  try {
    const response = await fetch('https://optic-gov.onrender.com/verify-milestone', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Verification failed: HTTP ${response.status}`);
    }

    const result = await response.json();
    
    // Submit to SUI blockchain
    try {
      const { suiService } = await import('./suiService');
      const { walletService } = await import('./walletService');
      
      const walletSigner = walletService.getSigner();
      if (walletSigner) {
        await suiService.submitMilestone(walletSigner, request.project_id.toString(), {
          index: request.milestone_index,
          evidence_url: request.video_url,
          verification_result: result
        });
      }
    } catch (suiError) {
      console.warn('SUI blockchain submission failed:', suiError);
    }
    
    return result;
  } catch (error) {
    console.error('Real-time verification failed:', error);
    throw error;
  }
}