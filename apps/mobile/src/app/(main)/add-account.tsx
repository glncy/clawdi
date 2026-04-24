import { useEffect, useState } from "react";
import { View, Pressable } from "react-native";
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
  Dialog,
} from "heroui-native";
import { useCSSVariable } from "uniwind";
import { Plus } from "phosphor-react-native";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { useAddAccountSheetStore } from "@/stores/useAddAccountSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCurrency } from "@/hooks/useCurrency";
import { AppText } from "@/components/atoms/Text";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// NOTE (Task 5.1): `type` is now a free-form string matched against the
// user-managed `accountTypes` list (seeded with 5 built-ins in Task 1.1).
// We keep validation loose (min 1) because the tiles themselves constrain
// the user to picking a valid entry or creating a new one via the dialog.
const accountSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.string().min(1, "Type is required"),
  balance: z
    .string()
    .refine((v) => !isNaN(parseFloat(v)), "Enter a valid amount"),
});

type AccountForm = z.infer<typeof accountSchema>;

export default function AddAccountScreen() {
  const { prefillData, clearPrefill } = useAddAccountSheetStore();
  const { addAccount, accountTypes, addAccountType } = useFinanceData();
  const { code: currencyCode } = useCurrency();

  const [primaryColor] = useCSSVariable(["--color-primary"]);

  // "New Type" dialog state — mirrors the "New Category" dialog shape in
  // add-transaction.tsx.
  const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeIcon, setNewTypeIcon] = useState("");

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

  // Consume AI prefill from the sheet once on mount.
  //
  // If `prefillData.type` matches an existing accountType (case-insensitive),
  // we set the form's `type` to the stored lowercase name. Otherwise we leave
  // the default untouched — the user can pick a tile or create a new type.
  useEffect(() => {
    if (prefillData) {
      if (prefillData.name) setValue("name", prefillData.name);
      if (prefillData.type) {
        const raw = prefillData.type.toLowerCase();
        const matched = accountTypes.find(
          (t) => t.name.toLowerCase() === raw,
        );
        if (matched) {
          setValue("type", matched.name.toLowerCase());
        }
      }
      if (prefillData.balance) setValue("balance", String(prefillData.balance));
      clearPrefill();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => {
    clearPrefill();
    router.back();
  };

  const onSubmit = async (data: AccountForm) => {
    // Look up the selected account type to reuse its emoji as the account
    // icon. Fallback to a neutral briefcase emoji if no match (shouldn't
    // happen post-validation, but guards against stale state).
    const selectedTypeEntry = accountTypes.find(
      (t) => t.name.toLowerCase() === data.type.toLowerCase(),
    );
    const icon = selectedTypeEntry?.icon ?? "💼";

    await addAccount({
      id: generateId(),
      name: data.name,
      type: data.type,
      balance: parseFloat(data.balance),
      currency: currencyCode,
      icon,
    });
    handleClose();
  };

  const handleCreateType = async () => {
    if (!newTypeName.trim() || !newTypeIcon.trim()) return;
    const id = `type-${Date.now()}`;
    const trimmedName = newTypeName.trim();
    await addAccountType({
      id,
      name: trimmedName,
      icon: newTypeIcon.trim(),
      isDefault: false,
      sortOrder: accountTypes.length,
    });
    setValue("type", trimmedName.toLowerCase());
    setNewTypeName("");
    setNewTypeIcon("");
    setShowNewTypeDialog(false);
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

        {/* Account Type tiles */}
        <View className="gap-1">
          <AppText size="xs" color="muted">
            Type
          </AppText>
          <View className="flex-row flex-wrap gap-3">
            {accountTypes
              .slice()
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map(({ id, name, icon }) => {
                const valueKey = name.toLowerCase();
                const isSelected = selectedType === valueKey;
                return (
                  <Pressable
                    key={id}
                    onPress={() => setValue("type", valueKey)}
                    accessibilityRole="button"
                    accessibilityLabel={`Account type ${name}`}
                    accessibilityState={{ selected: isSelected }}
                    className={`flex-row items-center gap-2 px-4 py-3 rounded-xl border ${
                      isSelected
                        ? "bg-primary/10 border-primary"
                        : "bg-surface border-border"
                    }`}
                  >
                    <AppText size="xl">{icon}</AppText>
                    <AppText size="sm" weight="medium">
                      {name}
                    </AppText>
                  </Pressable>
                );
              })}
            <Pressable
              onPress={() => setShowNewTypeDialog(true)}
              accessibilityRole="button"
              accessibilityLabel="Create a new account type"
              className="flex-row items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border"
            >
              <PhosphorIcon
                icon={Plus}
                size={16}
                color={primaryColor as string}
              />
              <AppText size="sm" weight="medium" className="text-primary">
                New Type
              </AppText>
            </Pressable>
          </View>
          {errors.type && (
            <AppText size="xs" color="danger" className="mt-1">
              {errors.type.message}
            </AppText>
          )}
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

      {/* New Type Dialog */}
      <Dialog isOpen={showNewTypeDialog} onOpenChange={setShowNewTypeDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <KeyboardAvoidingView behavior="padding">
            <Dialog.Content>
              <Dialog.Title>New Account Type</Dialog.Title>
              <View className="gap-4 mt-3">
                <TextField>
                  <Label>Icon (emoji)</Label>
                  <Input
                    value={newTypeIcon}
                    onChangeText={setNewTypeIcon}
                    placeholder="e.g. 💰"
                    className="text-center text-lg"
                  />
                </TextField>
                <TextField>
                  <Label>Name</Label>
                  <Input
                    value={newTypeName}
                    onChangeText={setNewTypeName}
                    placeholder="e.g. Crypto"
                    autoCapitalize="words"
                  />
                </TextField>
              </View>
              <View className="flex-row gap-3 mt-5">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => setShowNewTypeDialog(false)}
                >
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onPress={handleCreateType}
                  isDisabled={!newTypeName.trim() || !newTypeIcon.trim()}
                >
                  <Button.Label>Create</Button.Label>
                </Button>
              </View>
            </Dialog.Content>
          </KeyboardAvoidingView>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
