import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';

interface TransactionNotificationProps {
  show: boolean;
  type: 'success' | 'error';
  title: string;
  message: string;
  txHash?: string;
  explorerUrl?: string;
  onClose: () => void;
}

export const TransactionNotification = ({
  show,
  type,
  title,
  message,
  txHash,
  explorerUrl,
  onClose
}: TransactionNotificationProps) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-[#111811] border rounded-xl p-8 max-w-md w-full ${
              type === 'success' ? 'border-[#0df20d]' : 'border-red-500'
            }`}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-6">
              <div className={`size-16 mx-auto rounded-full flex items-center justify-center ${
                type === 'success' ? 'bg-[#0df20d]/10' : 'bg-red-500/10'
              }`}>
                <Icon 
                  name={type === 'success' ? 'check_circle' : 'error'} 
                  className={`text-3xl ${type === 'success' ? 'text-[#0df20d]' : 'text-red-500'}`}
                />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
              </div>

              {txHash && (
                <div className="bg-[#0a0a0a] border border-[#283928] rounded-lg p-4">
                  <p className="text-xs text-gray-400 mb-2">Transaction Hash:</p>
                  <p className="text-xs font-mono text-[#0df20d] break-all">{txHash}</p>
                  {explorerUrl && (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-2 inline-flex items-center gap-1"
                    >
                      View on Explorer
                      <Icon name="open_in_new" size="sm" />
                    </a>
                  )}
                </div>
              )}

              <button
                onClick={() => {
                  onClose();
                  if (type === 'success') {
                    setTimeout(() => {
                      window.location.href = '/contractor';
                    }, 300);
                  }
                }}
                className={`w-full font-bold py-3 rounded-lg transition-colors ${
                  type === 'success'
                    ? 'bg-[#0df20d] hover:bg-[#0be00b] text-black'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                }`}
              >
                {type === 'success' ? 'Continue to Dashboard' : 'Close'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};