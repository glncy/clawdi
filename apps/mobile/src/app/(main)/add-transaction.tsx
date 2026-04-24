import React, { useState, useMemo, useEffect } from "react";
import { View, Pressable, Keyboard, Platform } from "react-native";
import {
  KeyboardAvoidingView,
  KeyboardAwareScrollView,
} from "react-native-keyboard-controller";
import { Stack, router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format as formatDate } from "date-fns";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { AppText } from "@/components/atoms/Text";
import {
  Button,
  Input,
  Label,
  TextField,
  FieldError,
  Select,
  Separator,
  Dialog,
} from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddTransactionSheetStore } from "@/stores/useAddTransactionSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCurrency } from "@/hooks/useCurrency";
import { ArrowUp, ArrowDown, Plus, CalendarBlank } from "phosphor-react-native";
import { PhosphorIcon } from "@/components/atoms/PhosphorIcon";
import { useHeaderHeight } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const manualSchema = z.object({
  type: z.enum(["income", "expense"]),
  item: z.string().min(1, "Item is required"),
  amount: z
    .string()
    .refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  category: z.string().min(1, "Category required"),
  date: z.string().min(1, "Date is required"), // ISO timestamp
  note: z.string().optional(),
  accountId: z.string().optional(),
});

type ManualForm = z.infer<typeof manualSchema>;

export default function AddTransactionScreen() {
  const { prefillData, editingTransaction, clearModalData } =
    useAddTransactionSheetStore();
  const isEditMode = !!editingTransaction;
  const {
    addTransaction,
    updateTransaction,
    deleteTransaction,
    categories,
    addCategory,
    accounts,
  } = useFinanceData();
  const { code: currencyCode } = useCurrency();

  const [showNewCategoryDialog, setShowNewCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [androidPickerMode, setAndroidPickerMode] = useState<"date" | "time">(
    "date",
  );

  const [primaryColor, mutedColor] = useCSSVariable([
    "--color-primary",
    "--color-muted",
  ]);

  const nowIso = new Date().toISOString();

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ManualForm>({
    resolver: zodResolver(manualSchema),
    defaultValues: {
      type: "expense",
      item: "",
      amount: "",
      category: "Other",
      date: nowIso,
      note: "",
      accountId: "",
    },
  });

  const selectedType = watch("type");
  const selectedCategory = watch("category");
  const selectedAccountId = watch("accountId");
  const selectedDate = watch("date");

  const selectedDateObj = useMemo(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDate]);

  const formattedDateTime = useMemo(
    () => formatDate(selectedDateObj, "MMM d, yyyy · h:mm a"),
    [selectedDateObj],
  );

  const openDatePicker = () => {
    Keyboard.dismiss();
    setAndroidPickerMode("date");
    setShowDatePicker(true);
  };

  const handleDateChange = (
    event: DateTimePickerEvent,
    nextDate?: Date,
  ) => {
    if (Platform.OS === "android") {
      // Android fires `set` / `dismissed`; hide picker after each step.
      if (event.type === "dismissed" || !nextDate) {
        setShowDatePicker(false);
        return;
      }
      if (androidPickerMode === "date") {
        // Preserve existing time-of-day from selectedDateObj.
        const merged = new Date(nextDate);
        merged.setHours(
          selectedDateObj.getHours(),
          selectedDateObj.getMinutes(),
          0,
          0,
        );
        setValue("date", merged.toISOString(), { shouldDirty: true });
        // Chain into time picker.
        setAndroidPickerMode("time");
        setShowDatePicker(true);
      } else {
        const merged = new Date(selectedDateObj);
        merged.setHours(nextDate.getHours(), nextDate.getMinutes(), 0, 0);
        setValue("date", merged.toISOString(), { shouldDirty: true });
        setShowDatePicker(false);
      }
      return;
    }
    // iOS (inline / spinner): update live as user scrolls.
    if (nextDate) {
      setValue("date", nextDate.toISOString(), { shouldDirty: true });
    }
  };

  const categorySelectValue = useMemo(
    () =>
      selectedCategory
        ? { value: selectedCategory, label: selectedCategory }
        : undefined,
    [selectedCategory],
  );

  const accountSelectValue = useMemo(() => {
    if (!selectedAccountId) return { value: "", label: "None" };
    const acc = accounts.find((a) => a.id === selectedAccountId);
    return acc
      ? { value: acc.id, label: acc.name }
      : { value: "", label: "None" };
  }, [selectedAccountId, accounts]);

  useEffect(() => {
    if (editingTransaction) {
      reset({
        type: editingTransaction.type,
        item: editingTransaction.item,
        amount: String(editingTransaction.amount),
        category: editingTransaction.category,
        date: editingTransaction.date,
        note: editingTransaction.note || "",
        accountId: editingTransaction.accountId ?? "",
      });
    } else if (prefillData) {
      if (prefillData.type) setValue("type", prefillData.type);
      if (prefillData.item) setValue("item", prefillData.item);
      if (prefillData.amount) setValue("amount", String(prefillData.amount));
      if (prefillData.category) setValue("category", prefillData.category);
      if (prefillData.accountId) setValue("accountId", prefillData.accountId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-select the only account when exactly one exists and nothing is set.
  useEffect(() => {
    if (editingTransaction) return;
    if (prefillData?.accountId) return;
    if (accounts.length !== 1) return;
    if (watch("accountId")) return;
    setValue("accountId", accounts[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accounts.length, editingTransaction, prefillData]);

  const handleClose = () => {
    clearModalData();
    router.back();
  };

  const onSubmit = async (data: ManualForm) => {
    if (isEditMode && editingTransaction) {
      await updateTransaction(editingTransaction.id, {
        type: data.type,
        item: data.item,
        amount: parseFloat(data.amount),
        category: data.category,
        date: data.date,
        note: data.note || undefined,
        accountId: data.accountId || undefined,
      });
    } else {
      await addTransaction({
        id: generateId(),
        type: data.type,
        item: data.item,
        amount: parseFloat(data.amount),
        currency: currencyCode,
        category: data.category,
        date: data.date,
        note: data.note || undefined,
        accountId: data.accountId || undefined,
      });
    }
    handleClose();
  };

  const handleDeleteTransaction = async () => {
    if (editingTransaction) {
      await deleteTransaction(editingTransaction.id);
    }
    setShowDeleteDialog(false);
    handleClose();
  };

  const headerHeight = useHeaderHeight();
  const insets = useSafeAreaInsets();

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !newCategoryIcon.trim()) return;
    const id = `cat-${Date.now()}`;
    await addCategory({
      id,
      name: newCategoryName.trim(),
      icon: newCategoryIcon.trim(),
      isDefault: false,
      sortOrder: categories.length,
    });
    setValue("category", newCategoryName.trim());
    setNewCategoryName("");
    setNewCategoryIcon("");
    setShowNewCategoryDialog(false);
  };

  return (
    <>
      <Stack.Screen
        options={{ title: isEditMode ? "Edit Transaction" : "Add Transaction" }}
      />
      <KeyboardAwareScrollView
        bottomOffset={headerHeight + insets.bottom + 80}
        className="flex-1"
        contentContainerClassName="px-5 py-6 gap-4 pb-safe"
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
      >
        {/* Income / Expense toggle */}
        <View className="flex-row gap-2">
          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 ${
              selectedType === "expense" ? "bg-danger" : "bg-surface"
            }`}
            onPress={() => setValue("type", "expense")}
          >
            <ArrowDown
              size={14}
              weight="bold"
              color={
                selectedType === "expense" ? "#fff" : (mutedColor as string)
              }
            />
            <AppText
              size="sm"
              weight="medium"
              style={{
                color:
                  selectedType === "expense" ? "#fff" : (mutedColor as string),
              }}
            >
              Expense
            </AppText>
          </Pressable>
          <Pressable
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 ${
              selectedType === "income" ? "bg-success" : "bg-surface"
            }`}
            onPress={() => setValue("type", "income")}
          >
            <ArrowUp
              size={14}
              weight="bold"
              color={
                selectedType === "income" ? "#fff" : (mutedColor as string)
              }
            />
            <AppText
              size="sm"
              weight="medium"
              style={{
                color:
                  selectedType === "income" ? "#fff" : (mutedColor as string),
              }}
            >
              Income
            </AppText>
          </Pressable>
        </View>

        {/* Amount */}
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

        {/* Item */}
        <TextField isInvalid={!!errors.item}>
          <Label>Item</Label>
          <Controller
            control={control}
            name="item"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="What was it?"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          <FieldError>{errors.item?.message}</FieldError>
        </TextField>

        {/* Account Select */}
        <View className="gap-1">
          <AppText size="xs" color="muted">
            Account
          </AppText>
          <Select
            presentation="bottom-sheet"
            value={accountSelectValue}
            onOpenChange={(open) => {
              if (open) Keyboard.dismiss();
            }}
            onValueChange={(opt) => {
              const selected = opt as { value: string; label: string };
              setValue("accountId", selected.value);
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select account" />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="bottom-sheet" snapPoints={["50%"]}>
                <Select.ListLabel>Account</Select.ListLabel>
                <Select.Item value="" label="None">
                  <View className="flex-row items-center gap-3 flex-1">
                    <Select.ItemLabel />
                  </View>
                  <Select.ItemIndicator />
                </Select.Item>
                {accounts.map((acc) => (
                  <React.Fragment key={acc.id}>
                    <Separator />
                    <Select.Item value={acc.id} label={acc.name}>
                      <View className="flex-row items-center gap-3 flex-1">
                        <AppText className="text-xl">{acc.icon}</AppText>
                        <Select.ItemLabel />
                      </View>
                      <Select.ItemIndicator />
                    </Select.Item>
                  </React.Fragment>
                ))}
              </Select.Content>
            </Select.Portal>
          </Select>
        </View>

        {/* Date + Time */}
        <View className="gap-1">
          <AppText size="xs" color="muted">
            Date & time
          </AppText>
          <Pressable
            onPress={openDatePicker}
            accessibilityRole="button"
            accessibilityLabel={`Change date and time, currently ${formattedDateTime}`}
            className="flex-row items-center gap-3 rounded-xl bg-surface px-4 py-3.5"
          >
            <PhosphorIcon
              icon={CalendarBlank}
              size={18}
              color={mutedColor as string}
            />
            <AppText size="sm" weight="medium" className="flex-1">
              {formattedDateTime}
            </AppText>
          </Pressable>
          {errors.date && (
            <AppText size="xs" color="danger" className="mt-1">
              {errors.date.message}
            </AppText>
          )}
          {showDatePicker && Platform.OS === "ios" && (
            <View className="mt-1 rounded-xl bg-surface overflow-hidden">
              <DateTimePicker
                value={selectedDateObj}
                mode="datetime"
                display="inline"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
              <View className="flex-row justify-end px-3 pb-2">
                <Button
                  variant="tertiary"
                  size="sm"
                  onPress={() => setShowDatePicker(false)}
                >
                  <Button.Label>Done</Button.Label>
                </Button>
              </View>
            </View>
          )}
          {showDatePicker && Platform.OS === "android" && (
            <DateTimePicker
              value={selectedDateObj}
              mode={androidPickerMode}
              is24Hour={false}
              display="default"
              onChange={handleDateChange}
              maximumDate={androidPickerMode === "date" ? new Date() : undefined}
            />
          )}
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
              if (selected.value === "__new__") {
                setShowNewCategoryDialog(true);
              } else {
                setValue("category", selected.value);
              }
            }}
          >
            <Select.Trigger>
              <Select.Value placeholder="Select category" />
              <Select.TriggerIndicator />
            </Select.Trigger>
            <Select.Portal>
              <Select.Overlay />
              <Select.Content presentation="bottom-sheet" snapPoints={["50%"]}>
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
                <Separator />
                <Select.Item value="__new__" label="+ Add new category">
                  <View className="flex-row items-center gap-3 flex-1">
                    <PhosphorIcon
                      icon={Plus}
                      size={16}
                      color={primaryColor as string}
                    />
                    <Select.ItemLabel className="text-primary" />
                  </View>
                </Select.Item>
              </Select.Content>
            </Select.Portal>
          </Select>
          {errors.category && (
            <AppText size="xs" color="danger" className="mt-1">
              {errors.category.message}
            </AppText>
          )}
        </View>

        {/* Note */}
        <TextField>
          <Label>Note (optional)</Label>
          <Controller
            control={control}
            name="note"
            render={({ field: { value, onChange, onBlur } }) => (
              <Input
                placeholder="Any notes?"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </TextField>

        {isEditMode && (
          <Button
            variant="danger"
            className="w-full"
            onPress={() => setShowDeleteDialog(true)}
          >
            <Button.Label>Delete Transaction</Button.Label>
          </Button>
        )}
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
          <Button.Label>{isEditMode ? "Update" : "Save"}</Button.Label>
        </Button>
      </KeyboardAvoidingView>

      {/* New Category Dialog */}
      <Dialog
        isOpen={showNewCategoryDialog}
        onOpenChange={setShowNewCategoryDialog}
      >
        <Dialog.Portal>
          <Dialog.Overlay />
          <KeyboardAvoidingView behavior="padding">
            <Dialog.Content>
              <Dialog.Title>New Category</Dialog.Title>
              <View className="gap-4 mt-3">
                <TextField>
                  <Label>Icon (emoji)</Label>
                  <Input
                    value={newCategoryIcon}
                    onChangeText={setNewCategoryIcon}
                    placeholder="e.g. 🎮"
                    className="text-center text-lg"
                  />
                </TextField>
                <TextField>
                  <Label>Name</Label>
                  <Input
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    placeholder="e.g. Gaming"
                    autoCapitalize="words"
                  />
                </TextField>
              </View>
              <View className="flex-row gap-3 mt-5">
                <Button
                  variant="tertiary"
                  className="flex-1"
                  onPress={() => setShowNewCategoryDialog(false)}
                >
                  <Button.Label>Cancel</Button.Label>
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onPress={handleCreateCategory}
                  isDisabled={
                    !newCategoryName.trim() || !newCategoryIcon.trim()
                  }
                >
                  <Button.Label>Create</Button.Label>
                </Button>
              </View>
            </Dialog.Content>
          </KeyboardAvoidingView>
        </Dialog.Portal>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog isOpen={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <Dialog.Portal>
          <Dialog.Overlay />
          <Dialog.Content>
            <Dialog.Title>Delete Transaction?</Dialog.Title>
            <Dialog.Description>
              &quot;{editingTransaction?.item}&quot; will be permanently removed.
            </Dialog.Description>
            <View className="flex-row gap-3 mt-4">
              <Button
                variant="tertiary"
                className="flex-1"
                onPress={() => setShowDeleteDialog(false)}
              >
                <Button.Label>Cancel</Button.Label>
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onPress={handleDeleteTransaction}
              >
                <Button.Label>Delete</Button.Label>
              </Button>
            </View>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog>
    </>
  );
}
