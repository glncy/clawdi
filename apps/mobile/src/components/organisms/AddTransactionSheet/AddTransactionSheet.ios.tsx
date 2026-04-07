import { useState } from "react";
import { View, TextInput, Pressable, ScrollView } from "react-native";
import {
  BottomSheet,
  Group,
  Host,
  RNHostView,
} from "@expo/ui/swift-ui";
import {
  presentationDetents,
  presentationDragIndicator,
} from "@expo/ui/swift-ui/modifiers";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppText } from "@/components/atoms/Text";
import { Button } from "heroui-native";
import { useCSSVariable } from "uniwind";
import { useAddTransactionSheetStore } from "@/stores/useAddTransactionSheetStore";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useLocalAI } from "@/hooks/useLocalAI";
import { useIsAIAvailable } from "@/hooks/useIsAIAvailable";
import { useCurrency } from "@/hooks/useCurrency";
import { parseTransactionText } from "@/services/transactionParserService";
import { Lightning, ArrowUp, ArrowDown } from "phosphor-react-native";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const CATEGORIES = [
  "Food",
  "Groceries",
  "Transport",
  "Shopping",
  "Bills",
  "Health",
  "Entertainment",
  "Other",
] as const;

const manualSchema = z.object({
  type: z.enum(["income", "expense"]),
  item: z.string().min(1, "Item is required"),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  category: z.enum(CATEGORIES),
  date: z.string().min(1, "Date is required"),
  note: z.string().optional(),
});

type ManualForm = z.infer<typeof manualSchema>;

export const AddTransactionSheet = () => {
  const { isOpen, close } = useAddTransactionSheetStore();
  const { addTransaction, categories } = useFinanceData();
  const { code: currencyCode } = useCurrency();
  const { completeJSON } = useLocalAI();
  const isAIAvailable = useIsAIAvailable();

  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [aiText, setAiText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<ManualForm | null>(null);

  const [
    primaryColor,
    foregroundColor,
    mutedColor,
    surfaceColor,
    borderColor,
    dangerColor,
  ] = useCSSVariable([
    "--color-primary",
    "--color-foreground",
    "--color-muted",
    "--color-surface",
    "--color-border",
    "--color-danger",
  ]);

  const today = new Date().toISOString().split("T")[0];

  const { control, handleSubmit, reset, watch, setValue, formState: { errors } } =
    useForm<ManualForm>({
      resolver: zodResolver(manualSchema),
      defaultValues: {
        type: "expense",
        item: "",
        amount: "",
        category: "Other",
        date: today,
        note: "",
      },
    });

  const selectedType = watch("type");
  const selectedCategory = watch("category");

  const handleClose = () => {
    close();
    reset();
    setAiText("");
    setParsedPreview(null);
    setParseError(null);
    setMode(isAIAvailable ? "ai" : "manual");
  };

  const handleAIParse = async () => {
    if (!aiText.trim()) return;
    setIsParsing(true);
    setParseError(null);
    setParsedPreview(null);

    const result = await parseTransactionText(aiText, completeJSON);
    setIsParsing(false);

    if (!result) {
      setParseError("Couldn't parse that. Try 'coffee $4.50' or 'salary $3000'.");
      return;
    }

    const preview: ManualForm = {
      type: result.type,
      item: result.item,
      amount: String(result.amount),
      category: CATEGORIES.includes(result.category as typeof CATEGORIES[number])
        ? (result.category as typeof CATEGORIES[number])
        : "Other",
      date: today,
      note: "",
    };
    setParsedPreview(preview);
    setValue("type", preview.type);
    setValue("item", preview.item);
    setValue("amount", preview.amount);
    setValue("category", preview.category);
    setMode("manual");
  };

  const onSubmit = async (data: ManualForm) => {
    await addTransaction({
      id: generateId(),
      type: data.type,
      item: data.item,
      amount: parseFloat(data.amount),
      currency: currencyCode,
      category: data.category,
      date: data.date,
      note: data.note || undefined,
    });
    handleClose();
  };

  const renderAIMode = () => (
    <View className="gap-4">
      <AppText size="sm" color="muted">
        Describe your transaction in plain text
      </AppText>
      <View
        className="flex-row items-center gap-2 rounded-xl px-3.5 py-3"
        style={{ backgroundColor: surfaceColor as string, borderWidth: 1, borderColor: borderColor as string }}
      >
        <Lightning size={16} color={primaryColor as string} weight="fill" />
        <TextInput
          className="flex-1 text-base"
          style={{ color: foregroundColor as string }}
          placeholder="e.g. coffee 4.50 or salary 3000"
          placeholderTextColor={mutedColor as string}
          value={aiText}
          onChangeText={setAiText}
          onSubmitEditing={handleAIParse}
          returnKeyType="done"
          autoFocus
        />
      </View>
      {parseError && (
        <AppText size="xs" color="danger">
          {parseError}
        </AppText>
      )}
      <View className="flex-row gap-3">
        <Button
          variant="tertiary"
          className="flex-1"
          onPress={() => setMode("manual")}
        >
          <Button.Label>Manual</Button.Label>
        </Button>
        <Button
          className="flex-1"
          onPress={handleAIParse}
          isDisabled={!aiText.trim() || isParsing}
        >
          <Button.Label>{isParsing ? "Parsing..." : "Parse"}</Button.Label>
        </Button>
      </View>
    </View>
  );

  const renderManualMode = () => (
    <View className="gap-4">
      {/* Income / Expense toggle */}
      <View className="flex-row gap-2">
        {(["expense", "income"] as const).map((t) => (
          <Pressable
            key={t}
            className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl py-2.5 ${
              selectedType === t ? "bg-primary" : "bg-surface"
            }`}
            onPress={() => setValue("type", t)}
          >
            {t === "expense" ? (
              <ArrowDown
                size={14}
                weight="bold"
                color={selectedType === t ? "#fff" : (mutedColor as string)}
              />
            ) : (
              <ArrowUp
                size={14}
                weight="bold"
                color={selectedType === t ? "#fff" : (mutedColor as string)}
              />
            )}
            <AppText
              size="sm"
              weight="medium"
              style={{
                color:
                  selectedType === t ? "#fff" : (mutedColor as string),
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </AppText>
          </Pressable>
        ))}
      </View>

      {/* Amount */}
      <View className="gap-1">
        <AppText size="xs" color="muted">Amount</AppText>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="rounded-xl px-3.5 py-3 text-base"
              style={{
                backgroundColor: surfaceColor as string,
                color: foregroundColor as string,
                borderWidth: 1,
                borderColor: errors.amount
                  ? (dangerColor as string)
                  : (borderColor as string),
              }}
              placeholder="0.00"
              placeholderTextColor={mutedColor as string}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="decimal-pad"
            />
          )}
        />
        {errors.amount && (
          <AppText size="xs" color="danger">{errors.amount.message}</AppText>
        )}
      </View>

      {/* Item */}
      <View className="gap-1">
        <AppText size="xs" color="muted">Item</AppText>
        <Controller
          control={control}
          name="item"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="rounded-xl px-3.5 py-3 text-base"
              style={{
                backgroundColor: surfaceColor as string,
                color: foregroundColor as string,
                borderWidth: 1,
                borderColor: errors.item
                  ? (dangerColor as string)
                  : (borderColor as string),
              }}
              placeholder="What was it?"
              placeholderTextColor={mutedColor as string}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
        {errors.item && (
          <AppText size="xs" color="danger">{errors.item.message}</AppText>
        )}
      </View>

      {/* Category */}
      <View className="gap-1">
        <AppText size="xs" color="muted">Category</AppText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              className={`rounded-full px-3 py-1.5 ${
                selectedCategory === cat ? "bg-primary" : "bg-surface"
              }`}
              onPress={() => setValue("category", cat)}
            >
              <AppText
                size="xs"
                weight="medium"
                style={{
                  color:
                    selectedCategory === cat ? "#fff" : (foregroundColor as string),
                }}
              >
                {cat}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Note (optional) */}
      <View className="gap-1">
        <AppText size="xs" color="muted">Note (optional)</AppText>
        <Controller
          control={control}
          name="note"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className="rounded-xl px-3.5 py-3 text-base"
              style={{
                backgroundColor: surfaceColor as string,
                color: foregroundColor as string,
                borderWidth: 1,
                borderColor: borderColor as string,
              }}
              placeholder="Any notes?"
              placeholderTextColor={mutedColor as string}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </View>

      {isAIAvailable && (
        <Pressable onPress={() => setMode("ai")}>
          <AppText size="xs" color="primary" weight="medium">
            Use AI text input instead
          </AppText>
        </Pressable>
      )}

      <View className="flex-row gap-3">
        <Button variant="tertiary" className="flex-1" onPress={handleClose}>
          <Button.Label>Cancel</Button.Label>
        </Button>
        <Button className="flex-1" onPress={handleSubmit(onSubmit)}>
          <Button.Label>Save</Button.Label>
        </Button>
      </View>
    </View>
  );

  return (
    <Host style={{ position: "absolute", width: 0, height: 0 }}>
      <BottomSheet
        isPresented={isOpen}
        onIsPresentedChange={(presented) => {
          if (!presented) handleClose();
        }}
      >
        <Group
          modifiers={[
            presentationDetents(["medium", "large"]),
            presentationDragIndicator("visible"),
          ]}
        >
          <RNHostView>
            <View className="px-5 py-6 gap-4" style={{ flex: 1 }}>
              <AppText size="xl" weight="bold" family="headline">
                Add Transaction
              </AppText>
              {mode === "ai" && isAIAvailable
                ? renderAIMode()
                : renderManualMode()}
            </View>
          </RNHostView>
        </Group>
      </BottomSheet>
    </Host>
  );
};
