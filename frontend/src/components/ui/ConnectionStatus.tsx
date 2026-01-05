import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface ConnectionStatusProps {
  backendUrl?: string;
  suiNetwork?: string;
}

export const ConnectionStatus = ({ 
  backendUrl = 'https://optic-gov.onrender.com',
  suiNetwork = 'testnet'
}: ConnectionStatusProps) => {
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [suiStatus, setSuiStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    checkConnections();
    const interval = setInterval(checkConnections, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkConnections = async () => {
    // Check backend connection
    try {
      const response = await fetch(`${backendUrl}/health`, { 
        method: 'GET',
        timeout: 5000 
      } as any);
      setBackendStatus(response.ok ? 'connected' : 'disconnected');
    } catch {
      setBackendStatus('disconnected');
    }

    // Check SUI network connection
    try {
      const response = await fetch(`https://fullnode.${suiNetwork}.sui.io:443`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sui_getLatestSuiSystemState', params: [] })
      });
      setSuiStatus(response.ok ? 'connected' : 'disconnected');
    } catch {
      setSuiStatus('disconnected');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-[#38e07b]';
      case 'disconnected': return 'text-red-400';
      case 'checking': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return 'check_circle';
      case 'disconnected': return 'error';
      case 'checking': return 'refresh';
      default: return 'help';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <motion.div 
        className="bg-[#111814] border border-[#28392f] rounded-lg p-3 shadow-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: backendStatus === 'checking' ? 360 : 0 }}
              transition={{ duration: 1, repeat: backendStatus === 'checking' ? Infinity : 0 }}
            >
              <Icon 
                name={getStatusIcon(backendStatus)} 
                size="sm" 
                className={getStatusColor(backendStatus)} 
              />
            </motion.div>
            <span className="text-white">Backend:</span>
            <span className={getStatusColor(backendStatus)}>
              {backendStatus.charAt(0).toUpperCase() + backendStatus.slice(1)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: suiStatus === 'checking' ? 360 : 0 }}
              transition={{ duration: 1, repeat: suiStatus === 'checking' ? Infinity : 0 }}
            >
              <Icon 
                name={getStatusIcon(suiStatus)} 
                size="sm" 
                className={getStatusColor(suiStatus)} 
              />
            </motion.div>
            <span className="text-white">MNT:</span>
            <span className={getStatusColor(suiStatus)}>
              {suiStatus.charAt(0).toUpperCase() + suiStatus.slice(1)}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};