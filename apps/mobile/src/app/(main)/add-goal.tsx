import { useEffect } from "react";
import { View } from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import { Stack, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Label, TextField, FieldError } from "heroui-native";
import { useAddGoalSheetStore } from "@/stores/useAddGoalSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCurrency } from "@/hooks/useCurrency";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const goalSchema = z.object({
  name: z.string().min(1, "Name is required"),
  targetAmount: z.string().refine((v) => parseFloat(v) > 0, "Target must be positive"),
  currentAmount: z.string().refine(
    (v) => !isNaN(parseFloat(v)) && parseFloat(v) >= 0,
    "Enter a valid amount"
  ),
});

type GoalForm = z.infer<typeof goalSchema>;

export default function AddGoalScreen() {
  const { prefillData, clearModalData } = useAddGoalSheetStore();
  const { addSavingsGoal } = useFinanceData();
  const { code: currencyCode } = useCurrency();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<GoalForm>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      name: "",
      targetAmount: "",
      currentAmount: "0",
    },
  });

  useEffect(() => {
    if (prefillData) {
      if (prefillData.name) setValue("name", prefillData.name);
      if (prefillData.targetAmount)
        setValue("targetAmount", String(prefillData.targetAmount));
      if (prefillData.currentAmount)
        setValue("currentAmount", String(prefillData.currentAmount));
    }
  }, []);

  const handleClose = () => {
    clearModalData();
    router.back();
  };

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const onSubmit = async (data: GoalForm) => {
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + 1);

    await addSavingsGoal({
      id: generateId(),
      name: data.name,
      targetAmount: parseFloat(data.targetAmount),
      currentAmount: parseFloat(data.currentAmount),
      currency: currencyCode,
      targetDate: targetDate.toISOString().split("T")[0],
      icon: "🎯",
    });
    handleClose();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Add Savings Goal" }} />
      <KeyboardAwareScrollView
          bottomOffset={headerHeight + insets.bottom + 80}
          className="flex-1"
          contentContainerClassName="px-5 py-6 gap-4 pb-safe"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
        <TextField isInvalid={!!errors.name}>
          <Label>Goal Name</Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="e.g. Emergency Fund, Vacation"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoFocus
              />
            )}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </TextField>

        <TextField isInvalid={!!errors.targetAmount}>
          <Label>Target Amount</Label>
          <Controller
            control={control}
            name="targetAmount"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="0.00"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
              />
            )}
          />
          <FieldError>{errors.targetAmount?.message}</FieldError>
        </TextField>

        <TextField isInvalid={!!errors.currentAmount}>
          <Label>Already Saved</Label>
          <Controller
            control={control}
            name="currentAmount"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="0.00"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                keyboardType="decimal-pad"
              />
            )}
          />
          <FieldError>{errors.currentAmount?.message}</FieldError>
        </TextField>

        </KeyboardAwareScrollView>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={headerHeight + insets.bottom + 48}
        className="px-5 flex-row gap-3 mb-safe absolute bottom-0"
      >
          <Button variant="tertiary" className="flex-1" onPress={handleClose}>
            <Button.Label>Cancel</Button.Label>
          </Button>
          <Button className="flex-1" onPress={handleSubmit(onSubmit)}>
            <Button.Label>Save</Button.Label>
          </Button>
      </KeyboardAvoidingView>
    </>
  );
}
