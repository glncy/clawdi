import React, { useEffect, useMemo } from "react";
import { View, Pressable, Keyboard } from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import { Stack, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Button,
  Input,
  Label,
  TextField,
  FieldError,
  Select,
  Separator,
} from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddBillSheetStore } from "@/stores/useAddBillSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCurrency } from "@/hooks/useCurrency";
import { AppText } from "@/components/atoms/Text";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

const billSchema = z.object({
  name: z.string().min(1, "Name is required"),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  frequency: z.enum(["weekly", "monthly", "yearly"]),
  category: z.string().min(1, "Category is required"),
});

type BillForm = z.infer<typeof billSchema>;

export default function AddBillScreen() {
  const { prefillData, clearModalData } = useAddBillSheetStore();
  const { addRecurringBill, categories } = useFinanceData();
  const { code: currencyCode } = useCurrency();
  const [foregroundColor] = useCSSVariable(["--color-foreground"]);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BillForm>({
    resolver: zodResolver(billSchema),
    defaultValues: {
      name: "",
      amount: "",
      frequency: "monthly",
      category: "Bills",
    },
  });

  const selectedFrequency = watch("frequency");
  const selectedCategory = watch("category");

  const categorySelectValue = useMemo(
    () =>
      selectedCategory
        ? { value: selectedCategory, label: selectedCategory }
        : undefined,
    [selectedCategory]
  );

  useEffect(() => {
    if (prefillData) {
      if (prefillData.name) setValue("name", prefillData.name);
      if (prefillData.amount) setValue("amount", String(prefillData.amount));
      if (prefillData.frequency) setValue("frequency", prefillData.frequency);
      if (prefillData.category) setValue("category", prefillData.category);
    }
  }, []);

  const handleClose = () => {
    clearModalData();
    router.back();
  };

  const getNextDueDate = (frequency: string): string => {
    const d = new Date();
    if (frequency === "weekly") d.setDate(d.getDate() + 7);
    else if (frequency === "monthly") d.setMonth(d.getMonth() + 1);
    else d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().split("T")[0];
  };

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const onSubmit = async (data: BillForm) => {
    await addRecurringBill({
      id: generateId(),
      name: data.name,
      amount: parseFloat(data.amount),
      currency: currencyCode,
      frequency: data.frequency,
      nextDueDate: getNextDueDate(data.frequency),
      category: data.category,
      isPaid: false,
    });
    handleClose();
  };

  return (
    <>
      <Stack.Screen options={{ title: "Add Recurring Bill" }} />
      <KeyboardAwareScrollView
          bottomOffset={headerHeight + insets.bottom + 80}
          className="flex-1"
          contentContainerClassName="px-5 py-6 gap-4 pb-safe"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
        <TextField isInvalid={!!errors.name}>
          <Label>Bill Name</Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="e.g. Netflix, Rent"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoFocus
              />
            )}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </TextField>

        <TextField isInvalid={!!errors.amount}>
          <Label>Amount</Label>
          <Controller
            control={control}
            name="amount"
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
          <FieldError>{errors.amount?.message}</FieldError>
        </TextField>

        {/* Frequency */}
        <View className="gap-1">
          <AppText size="xs" color="muted">
            Frequency
          </AppText>
          <View className="flex-row gap-2">
            {FREQUENCIES.map(({ value, label }) => (
              <Pressable
                key={value}
                className={`flex-1 items-center rounded-xl py-2.5 ${
                  selectedFrequency === value ? "bg-primary" : "bg-surface"
                }`}
                onPress={() => setValue("frequency", value)}
              >
                <AppText
                  size="xs"
                  weight="medium"
                  style={{
                    color:
                      selectedFrequency === value
                        ? "#fff"
                        : (foregroundColor as string),
                  }}
                >
                  {label}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Category Select */}
        <View className="gap-1">
          <AppText size="xs" color="muted">
            Category
          </AppText>
          <Select
            presentation="bottom-sheet"
            value={categorySelectValue}
            onOpenChange={(open) => {
              if (open) Keyboard.dismiss();
            }}
            onValueChange={(opt) => {
              const selected = opt as { value: string; label: string };
              setValue("category", selected.value);
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select category" />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="bottom-sheet" snapPoints={["40%"]}>
                <Select.ListLabel>Category</Select.ListLabel>
                {categories
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((cat, i) => (
                    <React.Fragment key={cat.id}>
                      {i > 0 && <Separator />}
                      <Select.Item value={cat.name} label={cat.name}>
                        <View className="flex-row items-center gap-3 flex-1">
                          <AppText>{cat.icon}</AppText>
                          <Select.ItemLabel />
                        </View>
                        <Select.ItemIndicator />
                      </Select.Item>
                    </React.Fragment>
                  ))}
              </Select.Content>
            </Select.Portal>
          </Select>
          {errors.category && (
            <AppText size="xs" color="danger" className="mt-1">
              {errors.category.message}
            </AppText>
          )}
        </View>

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
