import React, { type ComponentType } from "react";
import { View } from "react-native";
import { AppText } from "@/components/atoms/Text";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { useCSSVariable } from "uniwind";
import type { IconProps } from "phosphor-react-native";

interface OnboardingHeaderProps {
  /** Phase title (e.g., "Your Life") */
  phase: string;
  /** Domain label (e.g., "Finances") */
  label: string;
  /** Phosphor icon for the domain */
  icon: ComponentType<IconProps>;
  /** Progress within the phase (0 to 1) */
  progress: number;
  /** Current step number */
  currentStep: number;
  /** Total steps in the phase */
  totalSteps: number;
}

export function OnboardingHeader({
  phase,
  label,
  icon,
  progress,
  currentStep,
  totalSteps,
}: OnboardingHeaderProps) {
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  return (
    <View className="w-full pt-16 px-6">
      {/* Progress Bar */}
      <View className="w-full h-1 bg-surface rounded-full overflow-hidden mb-6">
        <View
          className="h-full bg-primary"
          style={{ width: `${progress * 100}%` }}
        />
      </View>

      <View className="flex-row items-center justify-between mb-4">
        <View>
          <AppText size="xs" color="muted" weight="bold" className="uppercase tracking-widest">
            {phase}
          </AppText>
          <View className="flex-row items-center gap-2 mt-1">
            <PhosphorIcon icon={icon} size={18} color={primaryColor as string} weight="duotone" />
            <AppText size="sm" weight="semibold" color="primary">
              {label}
            </AppText>
          </View>
        </View>
        <View className="bg-surface rounded-full px-3 py-1">
          <AppText size="xs" weight="bold" color="muted">
            {currentStep} of {totalSteps}
          </AppText>
        </View>
      </View>
    </View>
  );
}
