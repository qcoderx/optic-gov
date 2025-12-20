import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';

export const AppFlowGuide = () => {
  return (
    <div className="bg-[#111714] text-white min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          className="text-4xl font-bold text-center mb-8 text-[#38e07b]"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          🚀 How to Use Optic-Gov
        </motion.h1>

        <div className="grid gap-6">
          {/* Step 1 */}
          <motion.div 
            className="bg-[#1a211e] border border-[#29382f] rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 bg-[#38e07b] text-black rounded-full flex items-center justify-center font-bold">1</div>
              <h2 className="text-xl font-bold">Governor Creates Project</h2>
            </div>
            <p className="text-[#9eb7a8] mb-3">✅ You've done this! Go to <code>/governor</code> → Fill form → Click "Deploy & Fund"</p>
            <div className="bg-[#29382f] p-3 rounded text-sm">
              <strong>What happens:</strong> Smart contract created, funds escrowed, contractor gets access
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div 
            className="bg-[#1a211e] border border-[#29382f] rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</div>
              <h2 className="text-xl font-bold">Contractor Submits Evidence</h2>
            </div>
            <p className="text-[#9eb7a8] mb-3">👷‍♂️ Contractor uploads video proof of milestone completion</p>
            <div className="flex gap-2 mb-3">
              <a href="/contractor" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-medium">
                🏗️ Contractor Dashboard
              </a>
              <a href="/contractor/milestone/1" className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm font-medium">
                📹 Submit Evidence
              </a>
            </div>
            <div className="bg-[#29382f] p-3 rounded text-sm">
              <strong>What happens:</strong> Video uploaded to IPFS, GPS coordinates captured, timestamp recorded
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div 
            className="bg-[#1a211e] border border-[#29382f] rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold">3</div>
              <h2 className="text-xl font-bold">AI Verification</h2>
            </div>
            <p className="text-[#9eb7a8] mb-3">🤖 AI analyzes video against milestone criteria</p>
            <div className="bg-[#29382f] p-3 rounded text-sm">
              <strong>What happens:</strong> AI Oracle checks if work matches requirements, verifies authenticity, approves/rejects
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div 
            className="bg-[#1a211e] border border-[#29382f] rounded-xl p-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-8 h-8 bg-[#38e07b] text-black rounded-full flex items-center justify-center font-bold">4</div>
              <h2 className="text-xl font-bold">Funds Released</h2>
            </div>
            <p className="text-[#9eb7a8] mb-3">💰 Smart contract automatically releases payment to contractor</p>
            <div className="bg-[#29382f] p-3 rounded text-sm">
              <strong>What happens:</strong> SUI/NGN transferred, milestone marked complete, next milestone unlocked
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="bg-gradient-to-r from-[#38e07b]/10 to-[#38e07b]/5 border border-[#38e07b]/30 rounded-xl p-6 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Icon name="rocket_launch" className="text-[#38e07b]" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/governor/projects" className="bg-[#29382f] hover:bg-[#35463b] p-4 rounded-lg text-center transition-colors">
                <div className="text-2xl mb-2">📊</div>
                <div className="font-medium">View Your Projects</div>
              </a>
              <a href="/contractor" className="bg-[#29382f] hover:bg-[#35463b] p-4 rounded-lg text-center transition-colors">
                <div className="text-2xl mb-2">🏗️</div>
                <div className="font-medium">Contractor Portal</div>
              </a>
              <a href="/transparency-map" className="bg-[#29382f] hover:bg-[#35463b] p-4 rounded-lg text-center transition-colors">
                <div className="text-2xl mb-2">🗺️</div>
                <div className="font-medium">Public Map</div>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
