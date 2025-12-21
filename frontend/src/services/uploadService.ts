const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";

class UploadService {
  async uploadVideo(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch(`${API_BASE_URL}/upload-video`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }

      const data = await response.json();
      return data.video_url || data.url;
    } catch (error) {
      console.error("UploadService.uploadVideo error:", error);
      throw error;
    }
  }
}

export const uploadService = new UploadService();
