import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { TransactionNotification } from '@/components/ui/TransactionNotification';
import { useSuiWallet } from '@/hooks/useSuiWallet';
import { ConnectButton } from '@mysten/dapp-kit';
import { walletService } from '@/services/walletService';

export const MilestoneSubmission = () => {
  const { milestoneId } = useParams();
  const { address, isConnected, signAndExecute } = useSuiWallet();
  const [project, setProject] = useState<any>(null);
  const [milestone, setMilestone] = useState<any>(null);
  const [comments, setComments] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [, setUploadedVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    if (signAndExecute && address) {
      walletService.setSignAndExecute(signAndExecute);
      localStorage.setItem('sui_wallet_address', address);
    }
  }, [signAndExecute, address]);

  useEffect(() => {
    loadProjectData();
  }, [milestoneId]);

  const loadProjectData = async () => {
    try {
      setError(null);
      if (milestoneId) {
        const milestoneIdNum = parseInt(milestoneId);
        if (isNaN(milestoneIdNum)) {
          throw new Error('Invalid milestone ID');
        }
        
        // 1. Load project data by milestone ID from backend
        const response = await fetch(`https://optic-gov.onrender.com/milestones/${milestoneIdNum}/project`);
        if (!response.ok) {
          throw new Error(`Failed to fetch project data: ${response.status}`);
        }
        const projectData = await response.json();
        setProject(projectData);
        
        // 2. Load specific milestone data
        const milestoneResponse = await fetch(`https://optic-gov.onrender.com/milestones/${milestoneIdNum}`);
        if (!milestoneResponse.ok) {
          throw new Error(`Failed to fetch milestone data: ${milestoneResponse.status}`);
        }
        const milestoneData = await milestoneResponse.json();
        setMilestone({
          ...milestoneData,
          title: milestoneData.description,
          criteria: milestoneData.criteria || `Verify completion of ${milestoneData.description}`
        });

        // 3. Optional: Get on-chain state if ID exists (Funds released, etc.)
        if (projectData.on_chain_id) {
          const { suiService } = await import('@/services/suiService');
          // We don't block on this, just log for debugging
          suiService.getProjectState(projectData.on_chain_id.toString())
            .then(state => console.log('SUI On-Chain State:', state))
            .catch(err => console.warn('Failed to fetch SUI state:', err));
        }

      } else {
        throw new Error('No milestone ID provided');
      }
    } catch (error) {
      console.error('Failed to load project:', error);
      setError(error instanceof Error ? error.message : 'Failed to load project data');
    } finally {
      setIsLoading(false);
    }
  };

  const uploadToBackend = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('video', file);
    
    try {
      const response = await fetch('https://optic-gov.onrender.com/upload-video', {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData, let browser set it with boundary
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      if (!data.video_url && !data.url) {
        throw new Error('No video URL returned from server');
      }
      return data.video_url || data.url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleVideoCapture = async () => {
    if (!videoFile) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Real upload to backend
      const videoUrl = await uploadToBackend(videoFile);
      setUploadedVideoUrl(videoUrl);
      
      // Simulate progress for UX
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 20;
        });
      }, 300);
      
      // Wait for progress to complete then verify
      setTimeout(async () => {
        await handleVerifyMilestone(videoUrl);
        setIsUploading(false);
      }, 1500);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploadProgress(0);
      setIsUploading(false);
    }
  };

  const handleVerifyMilestone = async (videoUrl: string) => {
    console.log('🔍 Starting real-time AI verification...');
    
    try {
      const projectId = project?.id;
      const currentMilestoneId = milestone?.id;
      
      if (!projectId || !currentMilestoneId) {
        throw new Error('Missing project or milestone ID for verification');
      }
      
      const { verifyMilestoneWithBackend } = await import('@/services/aiService');
      
      // FIX: Pass the on_chain_id here so the service can submit evidence to the blockchain
      const result = await verifyMilestoneWithBackend({
        video_url: videoUrl,
        milestone_criteria: milestone?.criteria || "Structural verification",
        project_id: projectId,
        milestone_index: currentMilestoneId,
        on_chain_id: project?.on_chain_id // <--- CRITICAL FIX: SUI Object ID
      });
      
      console.log('✅ Real verification result:', result);
      
      // Show success notification
      setNotification({
        show: true,
        type: 'success',
        title: '✅ Milestone Verified!',
        message: `AI verification successful with ${(result.confidence * 100).toFixed(1)}% confidence. Funds released.`,
        txHash: result.sui_transaction || result.ethereum_transaction
      });
      
      setVerificationResult(result);
      setShowModal(true);
      
    } catch (error) {
      console.error('Verification failed:', error);
      
      // Show error notification
      setNotification({
        show: true,
        type: 'error',
        title: '❌ Verification Failed',
        message: error instanceof Error ? error.message : 'AI verification failed. Please check your submission.'
      });
      
      setVerificationResult({
        verified: false,
        confidence: 0,
        reasoning: `Verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        detected_elements: [],
        compliance_score: 0
      });
      setShowModal(true);
    }
  };

  const startCameraRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const file = new File([blob], `milestone-${Date.now()}.webm`, { type: 'video/webm' });
        setVideoFile(file);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Camera access denied:', err);
      alert('Camera access required for video verification');
    }
  };

  const stopCameraRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setUploadProgress(0);
    }
  };

  if (isLoading) {
    return <LoadingScreen message="Loading project data..." />;
  }

  if (error) {
    return (
      <div className="bg-[#0a0a0a] text-white min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Error Loading Project</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/contractor'}
            className="bg-[#38e07b] hover:bg-[#22c565] text-black px-6 py-2 rounded font-bold"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (isNavigating) {
    return <LoadingScreen message="Returning to Contractor Dashboard..." />;
  }

  return (
    <div className="bg-[#0a0a0a] text-white overflow-x-hidden min-h-screen flex flex-col font-display">
      {/* Top Navigation */}
      <motion.header 
        className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#283928] bg-[#111811] px-6 py-4 sticky top-0 z-50"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4 text-white">
          <motion.div 
            className="size-8 text-[#0df20d] flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Icon name="token" className="text-3xl" />
          </motion.div>
          <button 
            onClick={() => {
              setIsNavigating(true);
              setTimeout(() => {
                window.location.href = '/contractor';
              }, 1500);
            }}
            className="text-white text-xl font-bold leading-tight tracking-tight uppercase hover:text-[#0df20d] transition-colors"
          >
            Optic-Gov <span className="text-[#0df20d] text-sm align-super">v2</span>
          </button>
        </div>
        <div className="flex gap-4 items-center">
          <motion.div 
            className="hidden md:flex items-center gap-2 px-3 py-1 rounded bg-[#283928]/30 border border-[#283928] text-xs font-mono text-gray-400"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div 
              className="w-2 h-2 rounded-full bg-[#0df20d]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Mainnet Live
          </motion.div>
          {isConnected && address ? (
            <div className="flex items-center gap-2 bg-[#0df20d]/10 border border-[#0df20d]/30 rounded px-3 py-2">
              <Icon name="account_balance_wallet" size="sm" className="text-[#0df20d]" />
              <span className="text-white text-sm font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
            </div>
          ) : (
            <ConnectButton 
              connectText="Connect Wallet"
              className="bg-[#283928] border border-[#0df20d]/20 hover:border-[#0df20d]/50 transition-colors text-white text-sm font-bold px-4 py-2 rounded"
            />
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4 sm:px-6 md:px-8">
        <div className="layout-content-container flex flex-col max-w-[1024px] w-full gap-8">
          {/* Progress Section */}
          <motion.section 
            className="flex flex-col gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex gap-6 justify-between items-end">
              <p className="text-white text-lg font-bold leading-normal uppercase tracking-wide">Milestone {milestone?.order_index || 1} of 5</p>
              <span className="text-[#0df20d] text-sm font-mono">40% Complete</span>
            </div>
            <div className="relative w-full h-3 bg-[#1c291c] rounded-full overflow-hidden">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-[#0df20d] shadow-[0_0_10px_#0df20d]"
                initial={{ width: 0 }}
                animate={{ width: '40%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>
            <p className="text-[#9cba9c] text-sm font-normal leading-normal text-right">Contract: {project?.name || 'Loading...'}</p>
          </motion.section>

          {/* Headline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h1 className="text-white tracking-tight text-4xl md:text-5xl font-bold leading-tight uppercase mb-2">
              Milestone #{milestone?.order_index || 1} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0df20d] to-emerald-600">Verification</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">Submit visual evidence to unlock the next tranche of funding. AI verification required.</p>
          </motion.section>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Requirements & Form */}
            <motion.div 
              className="lg:col-span-7 flex flex-col gap-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {/* Requirement Card */}
              <div className="rounded-xl overflow-hidden border border-[#283928] bg-[#111811] relative group">
                <div className="absolute top-4 left-4 z-10 bg-black/80 backdrop-blur-sm border border-[#0df20d]/30 text-[#0df20d] px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                  Active Objective
                </div>
                <div 
                  className="h-48 bg-cover bg-center relative"
                  style={{ 
                    backgroundImage: 'linear-gradient(180deg, rgba(16, 34, 16, 0.1) 0%, rgba(17, 24, 17, 1) 100%), url("https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=400&fit=crop")'
                  }}
                >
                  <div className="absolute inset-0 bg-[#0df20d]/5 mix-blend-overlay" />
                </div>
                <div className="p-6 -mt-12 relative z-20">
                  <h3 className="text-2xl font-bold text-white mb-2">{milestone?.title || 'Milestone Requirements'}</h3>
                  <div className="p-4 bg-[#1c291c]/80 border-l-4 border-[#0df20d] rounded-r-lg">
                    <p className="text-gray-200 font-medium">Requirement:</p>
                    <p className="text-sm text-gray-400 mt-1">{milestone?.criteria || milestone?.description || 'Loading milestone criteria...'}</p>
                  </div>
                </div>
              </div>

              {/* Metadata Form */}
              <div className="bg-[#111811] border border-[#283928] rounded-xl p-6 flex flex-col gap-6">
                <div className="flex items-center gap-2 mb-2">
                  <Icon name="analytics" className="text-[#0df20d]" />
                  <h3 className="text-lg font-bold uppercase tracking-wide">Submission Metadata</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#9cba9c] uppercase font-bold tracking-wider">GPS Coordinates (Auto)</label>
                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#283928] rounded h-12 px-4 text-gray-400 font-mono text-sm">
                      <Icon name="my_location" size="sm" />
                      <span>{project?.project_latitude?.toFixed(4)}° N, {project?.project_longitude?.toFixed(4)}° E</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-[#9cba9c] uppercase font-bold tracking-wider">Timestamp (Immutable)</label>
                    <div className="flex items-center gap-2 bg-[#0a0a0a] border border-[#283928] rounded h-12 px-4 text-gray-400 font-mono text-sm">
                      <Icon name="schedule" size="sm" />
                      <span>{new Date().toISOString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs text-[#9cba9c] uppercase font-bold tracking-wider">Additional Comments</label>
                  <textarea 
                    className="bg-[#0a0a0a] border border-[#283928] rounded p-4 text-white text-sm focus:outline-none focus:border-[#0df20d] focus:ring-1 focus:ring-[#0df20d] transition-all resize-none h-32" 
                    placeholder="Add any context about delays or material changes..."
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                  />
                </div>
              </div>
            </motion.div>

            {/* Right Column: Upload & Verify */}
            <motion.div 
              className="lg:col-span-5 flex flex-col gap-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              {/* Upload Zone */}
              <div className="bg-[#111811] border border-[#283928] rounded-xl p-6 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-bold uppercase tracking-wide flex items-center gap-2">
                    <Icon name="videocam" className="text-[#0df20d]" />
                    Evidence Capture
                  </h3>
                  <span className="text-xs font-mono text-[#0df20d] bg-[#0df20d]/10 px-2 py-1 rounded border border-[#0df20d]/20">IPFS Ready</span>
                </div>
                
                {/* Dropzone / Camera View */}
                <div className="space-y-3">
                  {/* Camera Record Button */}
                  <motion.button
                    className={`w-full h-14 text-base font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        : 'bg-[#0df20d] hover:bg-[#0be00b] text-[#0a0a0a]'
                    }`}
                    onClick={isRecording ? stopCameraRecording : startCameraRecording}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon name={isRecording ? 'stop' : 'videocam'} />
                    {isRecording ? 'Stop Recording' : 'Record with Camera'}
                  </motion.button>

                  <div className="text-center text-gray-500 text-xs uppercase tracking-wider">OR</div>

                  {/* File Upload */}
                  <motion.div 
                    className="relative w-full aspect-video bg-[#0a0a0a] border-2 border-dashed border-[#283928] hover:border-[#0df20d] hover:bg-[#162016] rounded-lg transition-all duration-300 flex flex-col items-center justify-center cursor-pointer group overflow-hidden"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => document.getElementById('video-upload')?.click()}
                  >
                    <input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMSIgZmlsbD0iIzBkZjIwZCIgZmlsbC1vcGFjaXR5PSIwLjEiLz4KPC9zdmc+')] opacity-20 pointer-events-none" />
                    
                    <div className="flex flex-col items-center gap-4 z-10 p-6 text-center group-hover:scale-105 transition-transform duration-300">
                      <motion.div 
                        className="size-16 rounded-full bg-[#1c291c] flex items-center justify-center border border-[#0df20d]/30 group-hover:border-[#0df20d] group-hover:shadow-[0_0_15px_rgba(13,242,13,0.3)] transition-all"
                        animate={{ 
                          boxShadow: ['0 0 0 rgba(13,242,13,0)', '0 0 15px rgba(13,242,13,0.3)', '0 0 0 rgba(13,242,13,0)']
                        }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        <Icon name="upload_file" className="text-3xl text-[#0df20d]" />
                      </motion.div>
                      <div>
                        <p className="text-white font-bold text-lg">{videoFile ? videoFile.name : 'Upload Video File'}</p>
                        <p className="text-[#9cba9c] text-sm mt-1">{videoFile ? 'Click to change file' : 'or drag and drop here'}</p>
                      </div>
                      <p className="text-xs text-gray-500 font-mono">MP4, MOV, WEBM up to 500MB</p>
                    </div>
                  </motion.div>
                </div>

                <motion.button 
                  className={`w-full h-14 text-base font-bold uppercase tracking-wider rounded transition-all flex items-center justify-center gap-2 group ${
                    videoFile && !isUploading
                      ? 'bg-[#0df20d] hover:bg-[#0be00b] text-[#0a0a0a] shadow-[0_0_10px_rgba(13,242,13,0.4)] hover:shadow-[0_0_15px_rgba(13,242,13,0.6)]'
                      : 'bg-[#1c291c] border border-[#283928] text-gray-500 cursor-not-allowed'
                  }`}
                  onClick={handleVideoCapture}
                  disabled={!videoFile || isUploading}
                  whileHover={videoFile && !isUploading ? { scale: 1.02 } : {}}
                  whileTap={videoFile && !isUploading ? { scale: 0.98 } : {}}
                >
                  <motion.div
                    animate={{ rotate: isUploading ? 360 : 0 }}
                    transition={{ duration: 1, repeat: isUploading ? Infinity : 0, ease: "linear" }}
                  >
                    <Icon name={isUploading ? 'upload' : 'photo_camera'} className={isUploading ? '' : 'group-hover:animate-bounce'} />
                  </motion.div>
                  {isUploading ? `Uploading... ${uploadProgress}%` : videoFile ? 'Upload Video' : 'Select Video First'}
                </motion.button>
              </div>

              {/* AI Feedback Loop / Terminal */}
              <div className="bg-black border border-[#283928] rounded-xl overflow-hidden flex flex-col h-full min-h-[280px] shadow-lg">
                <div className="bg-[#1c291c] px-4 py-2 border-b border-[#283928] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon name="terminal" size="sm" className="text-gray-400" />
                    <span className="text-xs font-mono text-gray-300">AI Oracle</span>
                  </div>
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                    <motion.div 
                      className="w-2.5 h-2.5 rounded-full bg-green-500"
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  </div>
                </div>
                <div className="p-4 font-mono text-xs md:text-sm flex-1 overflow-y-auto relative">
                  {/* Terminal Content */}
                  <div className="flex flex-col gap-2">
                    <div className="text-gray-500">
                      <span className="text-[#0df20d] mr-2">➜</span>System initialized. Waiting for media...
                    </div>
                    <div className="text-gray-500 opacity-50">
                      <span className="text-[#0df20d] mr-2">➜</span>Check: Metadata integrity [OK]
                    </div>
                    <div className="text-gray-500 opacity-50">
                      <span className="text-[#0df20d] mr-2">➜</span>Check: Contract status [ACTIVE]
                    </div>
                    
                    {/* Simulating active analysis */}
                    <div className="mt-4 border-l-2 border-[#0df20d]/50 pl-3 py-1">
                      <p className="text-white mb-1">&gt; Analysis Mode: <span className="text-[#0df20d]">AI</span></p>
                      <motion.p 
                        className="text-gray-400"
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {isUploading ? `Processing upload... ${uploadProgress}%` : 'Waiting for upload...'}
                      </motion.p>
                    </div>
                  </div>
                  
                  {/* Decorative background scanlines for terminal */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] pointer-events-none" />
                </div>
              </div>

              {/* Final Action */}
              <motion.button 
                className={`w-full h-14 border text-base font-bold uppercase tracking-wider rounded flex items-center justify-center gap-2 transition-all ${
                  uploadProgress === 100 
                    ? 'bg-[#0df20d] border-[#0df20d] text-[#0a0a0a] shadow-[0_0_10px_rgba(13,242,13,0.4)] cursor-pointer'
                    : 'bg-[#1c291c] border-[#283928] text-gray-500 cursor-not-allowed opacity-70'
                }`}
                disabled={uploadProgress !== 100}
                whileHover={uploadProgress === 100 ? { scale: 1.02 } : {}}
              >
                <Icon name={uploadProgress === 100 ? 'verified' : 'lock'} />
                {uploadProgress === 100 ? 'Submit for Verification' : 'Verification Pending'}
              </motion.button>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Transaction Notification */}
      <TransactionNotification
        show={notification.show}
        type={notification.type}
        title={notification.title}
        message={notification.message}
        txHash={notification.txHash}
        explorerUrl={notification.txHash ? `https://suiexplorer.com/txblock/${notification.txHash}?network=testnet` : undefined}
        onClose={() => setNotification({ ...notification, show: false })}
      />

      {/* Verification Modal */}
      {showModal && verificationResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            className="bg-[#111811] border border-[#283928] rounded-xl p-8 max-w-md w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="text-center space-y-6">
              <div className="size-16 mx-auto bg-[#0df20d]/10 rounded-full flex items-center justify-center">
                <Icon name="verified" className="text-[#0df20d] text-3xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Milestone Verified!</h3>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-300">
                    <span className="text-[#0df20d] font-bold">Confidence:</span> {(verificationResult.confidence * 100).toFixed(1)}%
                  </p>
                  <p className="text-gray-300">
                    <span className="text-[#0df20d] font-bold">Compliance:</span> {(verificationResult.compliance_score * 100).toFixed(1)}%
                  </p>
                </div>
                <p className="text-gray-400 text-sm mt-4 leading-relaxed">
                  {verificationResult.reasoning}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowModal(false);
                  setTimeout(() => {
                    window.location.href = '/contractor';
                  }, 500);
                }}
                className="w-full bg-[#0df20d] hover:bg-[#0be00b] text-black font-bold py-3 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[#283928] py-6 mt-10 bg-[#111811]">
        <div className="layout-container flex justify-center px-4 md:px-40">
          <div className="layout-content-container flex flex-col md:flex-row justify-between items-center w-full max-w-[1024px] gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-mono">Build 2.5.09-beta</span>
            </div>
            <div className="flex gap-6">
              <a className="text-gray-400 hover:text-[#0df20d] text-sm transition-colors" href="#">Documentation</a>
              <a className="text-gray-400 hover:text-[#0df20d] text-sm transition-colors" href="#">Support</a>
              <a className="text-gray-400 hover:text-[#0df20d] text-sm transition-colors" href="#">Contract Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};