import { motion } from 'framer-motion';
import { Icon } from '@/components/ui/Icon';
import { Web3Icon } from '@/components/ui/Web3Icon';
import { TypewriterOnView } from '@/components/ui/TypewriterOnView';
import type { Feature } from '@/types';

const features: Feature[] = [
  {
    icon: 'oracle',
    title: 'Autonomous Auditing',
    description: 'Smart contracts automatically verify milestones using Google Gemini\'s advanced vision capabilities to analyze site photos uploaded by contractors.',
  },
  {
    icon: 'defi',
    title: 'Transparent Payments',
    description: 'Public funds are held in escrow smart contracts. Money is only released when the AI Oracle confirms physical progress matches the blueprint specifications.',
  },
  {
    icon: 'blockchain',
    title: 'Real-time Progress',
    description: 'Stakeholders and citizens can view verified construction updates on an immutable public ledger, fostering total accountability.',
  },
];

export const FeaturesSection = () => {
  return (
    <section 
      id="features"
      className="w-full flex justify-center px-4 py-20 bg-background-dark relative border-y border-border-dark"
    >
      <div className="layout-content-container">
        <div className="mb-12">
          <h2 className="text-white text-3xl md:text-4xl font-bold leading-tight mb-4">
            The Future of Governance
          </h2>
          <p className="text-text-secondary text-base md:text-lg max-w-[700px]">
            Traditional auditing is slow and prone to human error. Optic-Gov creates 
            a trustless environment where code is law and progress is verified by AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              className="group flex flex-col p-6 rounded-xl bg-card-dark border border-border-dark"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ 
                borderColor: 'rgba(16, 185, 129, 0.5)',
                boxShadow: '0 10px 25px rgba(16, 185, 129, 0.1)'
              }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              tabIndex={0}
              role="article"
              aria-labelledby={`feature-${index}-title`}
            >
              <motion.div 
                className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-5"
                whileHover={{ scale: 1.1, rotate: 6 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Web3Icon name={feature.icon} size="lg" />
              </motion.div>
              
              <h3 
                id={`feature-${index}-title`}
                className="text-white text-xl font-bold mb-2"
              >
                <TypewriterOnView 
                  text={feature.title} 
                  delay={index * 300}
                  speed={60}
                />
              </h3>
              
              <p className="text-text-secondary text-sm leading-relaxed">
                <TypewriterOnView 
                  text={feature.description}
                  delay={index * 300 + 800}
                  speed={25}
                />
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};