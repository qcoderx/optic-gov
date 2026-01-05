import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { ExternalLink } from 'lucide-react'
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { TransactionNotification } from '@/components/ui/TransactionNotification';
import { useWallet } from '@/hooks/useWallet';
import { aiService } from '@/services/aiService';

export const MilestoneSubmission = () => {
  const { milestoneId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected } = useWallet();

  const navState = location.state as { 
    projectOnChainId?: string; 
    milestoneIndex?: number; 
    milestoneTitle?: string 
  } || {};

  const [project, setProject] = useState<any>(null);
  const [milestone, setMilestone] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    txHash?: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const mRes = await fetch(`http://localhost:8000/milestones/${milestoneId}`);
        if (!mRes.ok) throw new Error("Milestone not found");
        const mData = await mRes.json();
        setMilestone(mData);

        const pRes = await fetch(`http://localhost:8000/projects/${mData.project_id}`);
        if (!pRes.ok) throw new Error("Project not found");
        const pData = await pRes.json();
        setProject(pData);
      } catch (err: any) {
        setNotification({ show: true, type: 'error', title: 'Load Error', message: err.message });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [milestoneId]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setVideoFile(file);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      setVideoFile(new File([blob], "evidence.webm", { type: 'video/webm' }));
    };
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
  };

  const handleSubmit = async () => {
    if (!videoFile || !project || !milestone) return;
    setIsUploading(true);
    
    try {
      // 1. Real Upload (Granular 0% -> 60%)
      const videoUrl = await aiService.uploadVideo(videoFile, (progress) => {
        setUploadProgress(progress);
      });
  
      // 2. AI Processing Phase (Fake 60% -> 95%)
      const processingInterval = setInterval(() => {
        setUploadProgress(prev => (prev < 95 ? prev + 1 : prev));
      }, 800);
  
      const result = await aiService.verifyMilestone({
        video_url: videoUrl,
        milestone_criteria: milestone.description,
        project_id: Number(project.id),      // Ensure this is a number
        milestone_index: Number(milestone.order_index), // Ensure this is a number
      });
  
      clearInterval(processingInterval);
      setUploadProgress(100);
      setVerificationResult(result);
    
      if (result.verified) {
        setShowModal(true);
        setNotification({
          show: true,
          type: 'success',
          title: 'Verification Success',
          message: 'Gemini AI verified the work. Funds released on Mantle.',
          txHash: result.mantle_transaction 
        });
      } else {
        throw new Error(result.reasoning || "AI could not verify the evidence.");
      }

    } catch (err: any) {
      setNotification({
        show: true,
        type: 'error',
        title: 'Verification Failed',
        message: err.message
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return <LoadingScreen message="Initializing AI Oracle..." />;

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen font-display">
      <header className="border-b border-[#283928] bg-[#111811] px-6 py-4 sticky top-0 z-50 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-[#0df20d]">
          <Icon name="arrow_back" /> Back
        </button>
        <div className="text-[#0df20d] font-bold tracking-tighter uppercase">AI Oracle Terminal</div>
        <div className="text-xs font-mono text-gray-500">{isConnected ? 'Wallet Active' : 'Connect Wallet'}</div>
      </header>

      <main className="max-w-4xl mx-auto py-10 px-6 space-y-8">
        <section>
          <div className="flex justify-between items-end mb-2">
            <h1 className="text-4xl font-black uppercase">
              Milestone <span className="text-[#0df20d]">#{navState.milestoneIndex !== undefined ? navState.milestoneIndex + 1 : milestone?.order_index}</span>
            </h1>
            <span className="text-[#0df20d] font-mono text-sm">{project?.name}</span>
          </div>
          <div className="h-1 bg-[#1c291c] rounded-full overflow-hidden">
            <motion.div 
               className="h-full bg-[#0df20d]" 
               initial={{ width: 0 }} 
               animate={{ width: `${uploadProgress}%` }} 
            />
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-[#111811] border border-[#283928] p-6 rounded-xl">
              <h3 className="text-[#0df20d] text-xs font-bold uppercase mb-4 tracking-widest">Target Objective</h3>
              <p className="text-xl font-bold leading-tight">{milestone?.description}</p>
              <div className="mt-4 p-4 bg-black/40 rounded border border-[#283928] text-sm text-gray-400">
                AI will scan for: Material quality, structural integrity, and location proximity.
              </div>
            </div>

            <div className="bg-[#111811] border border-[#283928] p-6 rounded-xl space-y-4">
               <h3 className="text-white text-xs font-bold uppercase tracking-widest">Metadata</h3>
               <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500">GPS:</span>
                  <span className="text-gray-300">{project?.project_latitude}, {project?.project_longitude}</span>
               </div>
               <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500">CHAIN ID:</span>
                  <span className="text-gray-300">MANTLE-{project?.on_chain_id}</span>
               </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className={`aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${videoFile ? 'border-[#0df20d] bg-[#0df20d]/5' : 'border-[#283928] bg-[#111811] hover:border-gray-600'}`}>
              {videoFile ? (
                <div className="text-center p-4">
                  <Icon name="check_circle" className="text-[#0df20d] text-4xl mb-2" />
                  <p className="text-sm font-bold truncate max-w-[200px]">{videoFile.name}</p>
                  <button onClick={() => setVideoFile(null)} className="text-xs text-red-400 mt-2 uppercase font-bold">Remove</button>
                </div>
              ) : (
                <>
                  <Icon name="videocam" className="text-gray-600 text-5xl" />
                  <div className="text-center px-4">
                    <p className="text-sm font-bold">No Evidence Captured</p>
                    <p className="text-xs text-gray-500 mt-1">Record or upload a video of the site</p>
                  </div>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={isRecording ? stopRecording : startRecording} className={`h-12 rounded font-bold uppercase text-xs flex items-center justify-center gap-2 ${isRecording ? 'bg-red-600 animate-pulse' : 'bg-white text-black'}`}>
                <Icon name={isRecording ? 'stop' : 'videocam'} />
                {isRecording ? 'Stop' : 'Record'}
              </button>
              <button onClick={() => document.getElementById('file-up')?.click()} className="h-12 bg-[#283928] rounded font-bold uppercase text-xs flex items-center justify-center gap-2">
                <Icon name="upload" /> Upload
                <input id="file-up" type="file" hidden accept="video/*" onChange={handleFileUpload} />
              </button>
            </div>

            <button disabled={!videoFile || isUploading} onClick={handleSubmit} className="w-full h-14 bg-[#0df20d] disabled:bg-[#1c291c] disabled:text-gray-500 text-black font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#0df20d]/20 transition-all">
              {isUploading ? `Verifying... ${uploadProgress}%` : 'Execute AI Verification'}
            </button>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#111811] border border-[#0df20d]/30 p-8 rounded-2xl max-w-md w-full text-center">
            <div className="size-20 bg-[#0df20d]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="verified" className="text-[#0df20d] text-4xl" />
            </div>
            <h2 className="text-2xl font-black uppercase mb-2">Milestone Verified</h2>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">{verificationResult?.reasoning}</p>
            <div className="bg-black/50 p-4 rounded-lg mb-8 text-left space-y-2 border border-[#283928]">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-gray-500">AI Confidence:</span>
              {/* If backend sends 95, just show 95. If backend sends 0.95, keep the * 100 */}
              <span className="text-[#0df20d]">{verificationResult?.confidence_score}%</span>
            </div>
               <div className="flex justify-between text-xs font-mono">
                  <span className="text-gray-500">Mantle Status:</span>
                  <span className="text-[#0df20d]">Funds Released</span>
               </div>
            </div>
            <a 
              href={`https://explorer.testnet.mantle.xyz/tx/${verificationResult?.mantle_transaction}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded font-medium transition-colors gap-2"
            >
              View on Mantle Explorer
              <ExternalLink size={16} />
            </a>
            <button onClick={() => navigate('/contractor')} className="w-full py-4 bg-[#0df20d] text-black font-black uppercase rounded-lg hover:bg-[#0bc90b] transition-colors">
              Return to Dashboard
            </button>
          </motion.div>
        </div>
      )}

      <TransactionNotification {...notification} onClose={() => setNotification({ ...notification, show: false })} />
    </div>
  );
};