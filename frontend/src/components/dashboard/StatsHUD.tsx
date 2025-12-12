import { motion } from 'framer-motion';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { useInView } from '@/hooks/useInView';

const stats = [
  { label: 'ETH Locked', value: 12450, suffix: ' ETH' },
  { label: 'ETH Released', value: 4200, suffix: ' ETH' },
  { label: 'Corruption Prevented', value: 12040000, prefix: '$' }
];

export const StatsHUD = () => {
  const { ref, isInView } = useInView(0.3);

  return (
    <motion.div 
      ref={ref}
      className="hidden md:flex flex-1 max-w-3xl justify-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center gap-1 bg-[#1c2620]/80 backdrop-blur-md p-1.5 rounded-full border border-[#29382f] shadow-xl">
        <div className="flex flex-col md:flex-row items-center gap-6 px-6 py-2">
          {stats.map((stat, index) => (
            <motion.div 
              key={stat.label}
              className="flex flex-col items-center md:items-start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                {stat.label}
              </span>
              <span className={`font-mono font-bold text-lg leading-none ${
                index === 2 ? 'text-primary' : 'text-white'
              }`}>
                <AnimatedCounter
                  end={stat.value}
                  prefix={stat.prefix}
                  suffix={stat.suffix}
                  trigger={isInView}
                  duration={2000 + index * 300}
                />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};