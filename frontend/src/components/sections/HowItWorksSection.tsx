import { Icon } from '@/components/ui/Icon';
import { Web3Icon } from '@/components/ui/Web3Icon';
import type { ProcessStep } from '@/types';

const steps: ProcessStep[] = [
  {
    step: 1,
    title: 'Contractor Upload',
    description: 'Site photos are uploaded to the dApp via IPFS.',
    icon: 'nft',
    status: 'active',
  },
  {
    step: 2,
    title: 'Gemini Analysis',
    description: 'AI compares visual data against project blueprints.',
    icon: 'oracle',
    status: 'pending',
  },
  {
    step: 3,
    title: 'Oracle Verdict',
    description: 'Result is pushed on-chain via our custom Oracle.',
    icon: 'smart_contract',
    status: 'pending',
  },
  {
    step: 4,
    title: 'Funds Released',
    description: 'Smart contract unlocks escrowed funds.',
    icon: 'ethereum',
    status: 'completed',
  },
];

export const HowItWorksSection = () => {
  return (
    <section 
      id="how-it-works"
      className="w-full flex justify-center px-4 py-20 bg-background-dark"
    >
      <div className="layout-content-container items-center max-w-[960px]">
        <h2 className="text-white text-3xl font-bold leading-tight text-center mb-12">
          How Verification Works
        </h2>

        {/* Desktop Layout */}
        <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-x-4 w-full relative">
          {/* Connection Line */}
          <div className="absolute top-[24px] left-0 w-full h-[2px] bg-border-dark -z-10" />
          
          {steps.map((step, index) => (
            <div key={step.step} className="contents">
              {/* Step Circle and Content */}
              <div className="flex flex-col items-center text-center relative">
                <div 
                  className={`size-12 rounded-full bg-card-dark border-2 flex items-center justify-center z-10 transition-all duration-500 ${
                    step.status === 'active' 
                      ? 'border-primary shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse' 
                      : step.status === 'completed'
                      ? 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                      : 'border-border-dark'
                  }`}
                >
                  <Web3Icon name={step.icon} className="text-white" size="md" />
                </div>
                
                <div className="pt-4">
                  <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                    step.status === 'active' 
                      ? 'text-primary' 
                      : step.status === 'completed'
                      ? 'text-green-500'
                      : 'text-text-secondary'
                  }`}>
                    Step {step.step}
                  </p>
                  <h3 className="text-white text-lg font-bold mb-1">
                    {step.title}
                  </h3>
                  <p className="text-text-secondary text-sm">
                    {step.description}
                  </p>
                </div>
              </div>
              
              {/* Arrow (except for last step) */}
              {index < steps.length - 1 && (
                <div className="flex items-center justify-center pt-3 text-border-dark">
                  <Icon name="arrow_forward_ios" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden w-full grid grid-cols-[40px_1fr] gap-x-4 gap-y-8">
          {steps.map((step, index) => (
            <div key={step.step} className="contents">
              {/* Step Circle and Connector */}
              <div className="flex flex-col items-center gap-1">
                <div 
                  className={`size-12 rounded-full bg-card-dark border-2 flex items-center justify-center transition-all duration-500 ${
                    step.status === 'active' 
                      ? 'border-primary shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse' 
                      : step.status === 'completed'
                      ? 'border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                      : 'border-border-dark'
                  }`}
                >
                  <Web3Icon name={step.icon} className="text-white" size="md" />
                </div>
                {index < steps.length - 1 && (
                  <div className="w-[2px] bg-border-dark h-full grow" />
                )}
              </div>
              
              {/* Step Content */}
              <div className="flex flex-col py-1 pb-8">
                <p className={`text-sm font-bold uppercase tracking-wider mb-1 ${
                  step.status === 'active' 
                    ? 'text-primary' 
                    : step.status === 'completed'
                    ? 'text-green-500'
                    : 'text-text-secondary'
                }`}>
                  Step {step.step}
                </p>
                <h3 className="text-white text-lg font-bold mb-1">
                  {step.title}
                </h3>
                <p className="text-text-secondary text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};