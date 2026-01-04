import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { TransactionNotification } from '@/components/ui/TransactionNotification';
import { useWallet } from '@/hooks/useWallet';

export const MilestoneVerificationPage = () => {
  const { milestoneId } = useParams();
  const { address, isConnected, connect } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    type: 'success' | 'error';
    title: string;
    message: string;
    txHash?: string;
  }>({ show: false, type: 'success', title: '', message: '' });

  useEffect(() => {
    loadProjectData();
  }, [milestoneId]);

  const loadProjectData = async () => {
    try {
      if (!milestoneId) throw new Error('No milestone ID provided');
      const milestoneIdNum = parseInt(milestoneId);
      if (isNaN(milestoneIdNum)) throw new Error('Invalid milestone ID');
      
      // Get project data by milestone ID
      const response = await fetch(`https://optic-gov.onrender.com/milestones/${milestoneIdNum}/project`);
      if (!response.ok) {
        throw new Error(`Failed to fetch project data: ${response.status}`);
      }
      const projectData = await response.json();
      setProject(projectData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoBypass = async () => {
    if (!project) return;
    
    setIsVerifying(true);
    try {
      // Use the first milestone from the project's milestones array
      const firstMilestone = project.milestones?.[0];
      if (!firstMilestone) {
        throw new Error('No milestones found for this project');
      }
      
      const response = await fetch('https://optic-gov.onrender.com/demo-approve-milestone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project.id,
          milestone_id: firstMilestone.id,
          bypass: true
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Demo approval failed');
      }
      
      const result = await response.json();
      
      console.log('🔗 Full Response:', result);
      console.log('🔗 Transaction Digest:', result.sui_transaction);
      
      setNotification({
        show: true,
        type: 'success',
        title: '✅ Demo Approval Successful!',
        message: `Milestone approved and funds released. Transaction: ${result.sui_transaction || 'Pending'}`,
        txHash: result.sui_transaction
      });
      
      // Don't auto-redirect, let user close notification manually
    } catch (err) {
      setNotification({
        show: true,
        type: 'error',
        title: '❌ Demo Approval Failed',
        message: err instanceof Error ? err.message : 'Failed to approve milestone. Please try again.'
      });
      setIsVerifying(false);
    }
  };

  const handleVerifyMilestone = async () => {
    const firstMilestone = project?.milestones?.[0];
    if (firstMilestone) {
      window.location.href = `/contractor/milestone/${firstMilestone.id}`;
    }
  };

  if (loading) return (
    <div className="bg-[#0a0a0a] text-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0df20d] mx-auto mb-4"></div>
        <p>Loading project data...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="bg-[#0a0a0a] text-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-red-400 mb-4">Error: {error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="bg-[#0df20d] text-black px-4 py-2 rounded hover:bg-[#0be00b]"
        >
          Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#0a0a0a] text-white min-h-screen flex flex-col font-display">
      {/* Header */}
      <motion.header 
        className="flex items-center justify-between border-b border-[#283928] bg-[#111811] px-6 py-4"
        initial={{ y: -60 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-4">
          <motion.div 
            className="size-8 text-[#0df20d] flex items-center justify-center"
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Icon name="token" className="text-3xl" />
          </motion.div>
          <h1 className="text-white text-xl font-bold">Optic-Gov</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#283928]/30 border border-[#283928] text-xs font-mono text-gray-400">
            <div className="w-2 h-2 rounded-full bg-[#0df20d]" />
            Mainnet Live
          </div>
          {isConnected && address ? (
            <div className="flex items-center gap-2 bg-[#0df20d]/10 border border-[#0df20d]/30 rounded px-3 py-2">
              <Icon name="account_balance_wallet" size="sm" className="text-[#0df20d]" />
              <span className="text-white text-sm font-mono">{`${address.slice(0, 6)}...${address.slice(-4)}`}</span>
            </div>
          ) : (
            <button
              onClick={connect}
              className="bg-[#283928] border border-[#0df20d]/20 hover:border-[#0df20d]/50 transition-colors text-white text-sm font-bold px-4 py-2 rounded"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 flex justify-center py-8 px-4">
        <div className="max-w-2xl w-full space-y-8">
          {/* Active Contract Badge */}
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-block bg-[#0df20d]/10 border border-[#0df20d]/30 text-[#0df20d] px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider mb-4">
              Active Contract
            </div>
          </motion.div>

          {/* Project Title */}
          <motion.div 
            className="text-center space-y-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-white">{project?.name || 'Loading...'}</h2>
            <p className="text-gray-400">{project?.description || 'Loading project details...'}</p>
          </motion.div>

          {/* Funds Card */}
          <motion.div 
            className="bg-[#111811] border border-[#283928] rounded-xl p-8 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-gray-400 text-sm uppercase tracking-wider mb-4">Funds Locked in Smart Contract</p>
            <div className="space-y-2">
              <div className="text-6xl font-bold text-white">{project?.total_budget_SUI?.toFixed(2) || '0.00'}</div>
              <div className="text-[#0df20d] text-xl font-bold">SUI</div>
              <div className="text-gray-400">≈ ₦{project?.total_budget_ngn?.toLocaleString() || '0'}</div>
            </div>
          </motion.div>

          {/* Milestone Progress */}
          <motion.div 
            className="bg-[#111811] border border-[#283928] rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Milestone Progress</h3>
              <span className="text-[#0df20d] text-2xl font-bold">80%</span>
            </div>
            <div className="w-full bg-[#1c291c] rounded-full h-3 mb-4">
              <motion.div 
                className="bg-[#0df20d] h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '80%' }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-400">
              <span>Contract #{project?.on_chain_id || 'Loading...'}</span>
              <a href="#" className="text-[#0df20d] hover:underline">View on SUIerscan</a>
            </div>
          </motion.div>

          {/* Verify Buttons */}
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {/* Demo Bypass Button */}
            <Button 
              className="w-full h-16 text-lg font-bold uppercase tracking-wider rounded-xl transition-all bg-yellow-500 hover:bg-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]"
              onClick={handleDemoBypass}
              disabled={isVerifying}
            >
              {isVerifying ? (
                <div className="flex items-center justify-center gap-3">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Icon name="refresh" />
                  </motion.div>
                  Processing Demo Approval...
                </div>
              ) : (
                <>
                  <Icon name="bolt" className="mr-2" />
                  DEMO: Instant Approve & Release Funds
                </>
              )}
            </Button>
            <p className="text-yellow-500 text-xs font-bold uppercase tracking-wider">
              ⚠️ Demo Mode: Bypasses AI verification
            </p>

            {/* Regular Verification Button */}
            <Button 
              className="w-full h-16 text-lg font-bold uppercase tracking-wider rounded-xl transition-all bg-[#0df20d] hover:bg-[#0be00b] text-[#0a0a0a] shadow-[0_0_15px_rgba(13,242,13,0.4)]"
              onClick={handleVerifyMilestone}
            >
              <Icon name="videocam" className="mr-2" />
              Upload Video for AI Verification
            </Button>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Standard verification requires a 10s video scan. Gemini 3 Flash will analyze the footage.
            </p>
          </motion.div>

          {/* Timeline */}
          <motion.div 
            className="bg-[#111811] border border-[#283928] rounded-xl p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h3 className="text-lg font-bold mb-6">Timeline</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-[#0df20d]" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Foundation Poured</span>
                    <span className="text-sm text-[#0df20d]">Verified · 2 days ago</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Curing Verification</span>
                    <span className="text-sm text-yellow-400">Pending Action</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-3 h-3 rounded-full bg-gray-500" />
                <div className="flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-400">Safety Inspection</span>
                    <span className="text-sm text-gray-400">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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

      {/* Footer */}
      <footer className="border-t border-[#283928] py-6 bg-[#111811]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center gap-4 mb-4">
            <span className="text-gray-400">Powered by</span>
            <div className="flex items-center gap-2">
              <Icon name="currency_bitcoin" className="text-[#0df20d]" />
              <span className="font-bold">SUIereum</span>
            </div>
            <span className="text-gray-400">&</span>
            <div className="flex items-center gap-2">
              <Icon name="smart_toy" className="text-[#0df20d]" />
              <span className="font-bold">Google Gemini</span>
            </div>
          </div>
          <p className="text-gray-500 text-sm">© 2024 Optic-Gov Protocol. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
