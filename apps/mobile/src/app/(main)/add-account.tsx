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
import {
  Button,
  Input,
  Label,
  TextField,
  FieldError,
  Chip,
} from "heroui-native";
import { useAddAccountSheetStore } from "@/stores/useAddAccountSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCurrency } from "@/hooks/useCurrency";
import { AppText } from "@/components/atoms/Text";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit", label: "Credit" },
  { value: "cash", label: "Cash" },
  { value: "investment", label: "Investment" },
] as const;

const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(["checking", "savings", "credit", "cash", "investment"]),
  balance: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)), "Enter a valid amount"),
});

type AccountForm = z.infer<typeof accountSchema>;

export default function AddAccountScreen() {
  const { prefillData, clearModalData } = useAddAccountSheetStore();
  const { addAccount } = useFinanceData();
  const { code: currencyCode } = useCurrency();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AccountForm>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "checking",
      balance: "",
    },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (prefillData) {
      if (prefillData.name) setValue("name", prefillData.name);
      if (prefillData.type) setValue("type", prefillData.type);
      if (prefillData.balance) setValue("balance", String(prefillData.balance));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    clearModalData();
    router.back();
  };

  const onSubmit = async (data: AccountForm) => {
    await addAccount({
      id: generateId(),
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance),
      currency: currencyCode,
      icon: data.type === "credit" ? "💳" : data.type === "cash" ? "💵" : "🏦",
    });
    handleClose();
  };

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ title: "Add Account" }} />
      <KeyboardAwareScrollView
        bottomOffset={headerHeight + insets.bottom + 80}
        className="flex-1"
        contentContainerClassName="px-5 py-6 gap-4 pb-safe"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        <TextField isInvalid={!!errors.name}>
          <Label>Account Name</Label>
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="e.g. Main Checking"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoFocus
              />
            )}
          />
          <FieldError>{errors.name?.message}</FieldError>
        </TextField>

        {/* Account Type */}
        <View className="gap-1">
          <AppText size="xs" color="muted">
            Type
          </AppText>
          <View className="flex-row flex-wrap gap-2">
            {ACCOUNT_TYPES.map(({ value, label }) => (
              <Chip
                key={value}
                variant={selectedType === value ? "primary" : "secondary"}
                color={selectedType === value ? "accent" : "default"}
                onPress={() => setValue("type", value)}
              >
                <Chip.Label>{label}</Chip.Label>
              </Chip>
            ))}
          </View>
        </View>

        <TextField isInvalid={!!errors.balance}>
          <Label>Current Balance</Label>
          <Controller
            control={control}
            name="balance"
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
          <FieldError>{errors.balance?.message}</FieldError>
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
