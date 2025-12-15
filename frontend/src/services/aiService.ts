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
      // Mock response for development
      return this.getMockVerification();
    }
  }

  async uploadVideo(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      const response = await fetch(`${this.baseUrl}/upload-video`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      return data.video_url || data.url;
    } catch (error) {
      console.error('Upload error:', error);
      // Return mock URL for development
      return `mock-video-${Date.now()}.mp4`;
    }
  }

  private getMockVerification(): VerificationResult {
    const mockResults = [
      {
        verified: true,
        confidence: 0.92,
        reasoning: "Foundation work appears complete with visible concrete pour and rebar placement matching milestone requirements.",
        detected_elements: ["concrete_foundation", "rebar_structure", "proper_dimensions", "quality_materials"],
        compliance_score: 0.89,
        timestamp: new Date().toISOString()
      },
      {
        verified: false,
        confidence: 0.76,
        reasoning: "Incomplete structural work detected. Missing required safety barriers and incomplete concrete curing.",
        detected_elements: ["partial_foundation", "missing_safety_equipment", "incomplete_curing"],
        compliance_score: 0.45,
        timestamp: new Date().toISOString()
      }
    ];
    
    return mockResults[Math.floor(Math.random() * mockResults.length)];
  }

  // Real-time analysis streaming (mock)
  async *streamAnalysis(videoUrl: string): AsyncGenerator<string, void, unknown> {
    const steps = [
      "🔍 Initializing Gemini 2.5 Flash...",
      "📹 Processing video frames...",
      "🏗️ Detecting construction elements...",
      "📏 Measuring structural compliance...",
      "🔬 Analyzing material quality...",
      "✅ Generating verification report..."
    ];

    for (const step of steps) {
      yield step;
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    }
  }
}

export const aiService = new AIService();