import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { Web3Icon } from '@/components/ui/Web3Icon';
import { useInView } from '@/hooks/useInView';

const stats = [
  {
    icon: 'ethereum',
    value: 2847,
    suffix: ' ETH',
    label: 'Total Value Locked',
    description: 'Secured in smart contracts'
  },
  {
    icon: 'smart_contract',
    value: 156,
    label: 'Active Projects',
    description: 'Currently being verified'
  },
  {
    icon: 'oracle',
    value: 99.7,
    suffix: '%',
    label: 'Oracle Accuracy',
    description: 'AI verification precision'
  },
  {
    icon: 'dao',
    value: 12500,
    prefix: '$',
    suffix: 'M',
    label: 'Infrastructure Value',
    description: 'Projects completed'
  }
];

export const StatsSection = () => {
  const { ref, isInView } = useInView(0.3);
  
  return (
    <section className="w-full flex justify-center px-4 py-16 bg-gradient-to-r from-background-dark via-card-dark to-background-dark border-y border-border-dark">
      <div className="layout-content-container" ref={ref}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-center text-center group"
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <motion.div 
                className="mb-4 p-3 rounded-xl bg-primary/10 text-primary"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Web3Icon name={stat.icon} size="lg" />
              </motion.div>
              
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                <AnimatedCounter
                  end={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  duration={2000 + index * 300}
                  trigger={isInView}
                />
              </div>
              
              <h3 className="text-sm font-semibold text-primary mb-1">
                {stat.label}
              </h3>
              
              <p className="text-xs text-text-secondary">
                {stat.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};