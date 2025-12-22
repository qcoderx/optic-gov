import { useState } from "react";
import { motion } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { projectService } from "@/services/projectService";
import { currencyService } from "@/services/currencyService";

interface ManualMilestoneFormProps {
  projectId: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const ManualMilestoneForm = ({
  projectId,
  onSuccess,
  onCancel,
}: ManualMilestoneFormProps) => {
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    order_index: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert NGN amount to SUI for backend
      const nairaAmount = parseFloat(formData.amount);
      if (isNaN(nairaAmount) || nairaAmount <= 0) {
        throw new Error("Please enter a valid amount in NGN");
      }

      const suiAmount = await currencyService.quickConvertNgnToSui(nairaAmount);

      await projectService.createManualMilestone({
        project_id: projectId,
        description: formData.description.trim(),
        amount: suiAmount,
        order_index: formData.order_index,
      });

      onSuccess?.();
    } catch (error) {
      console.error("Failed to create milestone:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create milestone"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1c2720] border border-[#28392f] rounded-xl p-6 max-w-md w-full mx-auto"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="size-10 bg-[#38e07b]/20 rounded-lg flex items-center justify-center">
          <Icon name="add_task" className="text-[#38e07b]" />
        </div>
        <div>
          <h3 className="text-white text-lg font-bold">
            Create Manual Milestone
          </h3>
          <p className="text-[#9db9a8] text-sm">
            Add a custom milestone to this project
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 flex items-center gap-2"
        >
          <Icon name="error" size="sm" />
          <p className="text-sm">{error}</p>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#9db9a8] mb-2">
            Milestone Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe what needs to be completed..."
            className="w-full px-3 py-2 bg-[#111814] border border-[#28392f] rounded-lg text-white placeholder-[#9db9a8] focus:border-[#38e07b] focus:outline-none resize-none"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#9db9a8] mb-2">
            Amount (NGN)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9db9a8]">
              ₦
            </span>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2 bg-[#111814] border border-[#28392f] rounded-lg text-white placeholder-[#9db9a8] focus:border-[#38e07b] focus:outline-none"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#9db9a8] mb-2">
            Order Index
          </label>
          <input
            type="number"
            value={formData.order_index}
            onChange={(e) =>
              handleInputChange("order_index", parseInt(e.target.value) || 1)
            }
            placeholder="1"
            className="w-full px-3 py-2 bg-[#111814] border border-[#28392f] rounded-lg text-white placeholder-[#9db9a8] focus:border-[#38e07b] focus:outline-none"
            min="1"
            required
          />
          <p className="text-xs text-[#9db9a8] mt-1">
            Order in which this milestone should be completed
          </p>
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1 border-[#28392f] bg-[#111814] text-white hover:text-[#38e07b] hover:border-[#38e07b]"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-[#38e07b] hover:bg-[#22c565] text-[#111814] font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="size-4 border-2 border-[#111814] border-t-transparent rounded-full animate-spin" />
                Creating...
              </div>
            ) : (
              "Create Milestone"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};
