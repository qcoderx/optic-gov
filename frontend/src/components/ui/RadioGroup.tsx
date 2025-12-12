import { motion } from 'framer-motion';
import { Icon } from './Icon';

interface RadioOption {
  value: string;
  label: string;
  icon: string;
}

interface RadioGroupProps {
  label: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  name: string;
}

export const RadioGroup = ({ label, options, value, onChange, name }: RadioGroupProps) => {
  return (
    <div className="space-y-2">
      <label className="text-white text-sm font-medium pl-1">{label}</label>
      <div className="flex bg-[#111813] p-1.5 rounded-lg border border-[#3b5443]">
        {options.map((option) => (
          <label key={option.value} className="flex-1 relative cursor-pointer group">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="peer sr-only"
            />
            <motion.span
              className="flex items-center justify-center py-2.5 px-3 rounded-md text-sm font-medium text-text-secondary peer-checked:bg-[#28392e] peer-checked:text-white peer-checked:shadow-sm transition-all duration-200 hover:text-white"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon name={option.icon} size="sm" className="mr-2" />
              {option.label}
            </motion.span>
          </label>
        ))}
      </div>
    </div>
  );
};