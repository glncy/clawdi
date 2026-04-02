import React, { useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Text } from "@/components/atoms/Text";
import { Button, Input } from "heroui-native";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";

const SAVING_GOALS = ["Emergency Fund", "Travel", "House", "Debt Payoff"];
const STRUGGLES = ["Saving money", "Sleeping well", "Staying focused", "Finding time"];

export default function OnboardingStepQuestions() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(0);
  const [income, setIncome] = useState("");
  const [savingFor, setSavingFor] = useState("");
  const [struggle, setStruggle] = useState("");

  const handleNext = () => {
    if (currentStep === 0 && income) {
      setCurrentStep(1);
    } else if (currentStep === 1 && savingFor) {
      setCurrentStep(2);
    } else if (currentStep === 2 && struggle) {
      router.push("/(main)/onboarding/step-score");
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 0) return !income;
    if (currentStep === 1) return !savingFor;
    if (currentStep === 2) return !struggle;
    return true;
  };

  return (
    <View className="flex-1 bg-background px-6 pt-16 pb-12">
      {/* Progress Bar */}
      <View className="w-full h-1 bg-border rounded-full mb-12 overflow-hidden">
        <View
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentStep + 1) / 3) * 100}%` }}
        />
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingBottom: 80 }}>
        {currentStep === 0 && (
          <View>
            <Text variant="h2" className="text-center mb-8">
              What is your monthly income?
            </Text>
            <View className="mx-4">
              <Input
                value={income}
                onChangeText={setIncome}
                keyboardType="decimal-pad"
                placeholder="0.00"
                autoFocus
                size="lg"
                startContent={
                  <Text variant="h2" className="text-foreground-500 mr-2">$</Text>
                }
              />
            </View>
          </View>
        )}

        {currentStep === 1 && (
          <View>
            <Text variant="h2" className="text-center mb-8">
              What are you saving for?
            </Text>
            <View className="gap-4">
              {SAVING_GOALS.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  onPress={() => setSavingFor(goal)}
                  className={`p-4 rounded-xl border-2 flex-row items-center justify-between ${
                    savingFor === goal ? "border-primary bg-primary/10" : "border-border bg-surface"
                  }`}
                >
                  <Text variant="body" className="font-medium">{goal}</Text>
                  {savingFor === goal && (
                    <PhosphorIcon name="CheckCircle" weight="fill" size={24} color="currentColor" className="text-primary" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {currentStep === 2 && (
          <View>
            <Text variant="h2" className="text-center mb-8">
              What is your biggest daily struggle?
            </Text>
            <View className="gap-4">
              {STRUGGLES.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => setStruggle(s)}
                  className={`p-4 rounded-xl border-2 flex-row items-center justify-between ${
                    struggle === s ? "border-primary bg-primary/10" : "border-border bg-surface"
                  }`}
                >
                  <Text variant="body" className="font-medium">{s}</Text>
                  {struggle === s && (
                    <PhosphorIcon name="CheckCircle" weight="fill" size={24} color="currentColor" className="text-primary" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <View className="flex-row justify-between gap-4 pt-4 bg-background">
        <Button
          variant="flat"
          className="flex-1 h-14 rounded-2xl bg-surface"
          onPress={handleBack}
        >
          <Text variant="body" className="font-bold text-foreground">
            Back
          </Text>
        </Button>
        <Button
          color="primary"
          className="flex-1 h-14 rounded-2xl"
          onPress={handleNext}
          isDisabled={isNextDisabled()}
        >
          <Text variant="body" className="font-bold text-white">
            {currentStep === 2 ? "Finish" : "Next"}
          </Text>
        </Button>
      </View>
    </View>
  );
}
