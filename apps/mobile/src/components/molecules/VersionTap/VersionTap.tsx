import { View, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  Button,
  TextField,
  Input,
  Separator,
  FieldError,
} from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { useChannelSurfing } from "@/hooks/useChannelSurfing";
import Constants from "expo-constants";

const channelSchema = z.object({
  channel: z
    .string()
    .trim()
    .refine(
      (val) => !val || /^[a-zA-Z0-9]([a-zA-Z0-9\-\_\/\.]*[a-zA-Z0-9])?$/.test(val),
      "Invalid channel name."
    ),
});

type ChannelFormData = z.infer<typeof channelSchema>;

const LOG_COLORS = {
  info: "muted" as const,
  error: "danger" as const,
  success: "primary" as const,
};

/**
 * Version display with hidden channel surfing panel.
 * Tap the version text 5 times within 3 seconds to reveal the channel switcher.
 * @level Molecule
 */
export const VersionTap = () => {
  const {
    isVisible,
    isSwitching,
    activeChannel,
    logs,
    handleVersionTap,
    switchChannel,
    checkForUpdate,
    hidePanel,
    clearLogs,
  } = useChannelSurfing();

  const [showLogs, setShowLogs] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChannelFormData>({
    resolver: zodResolver(channelSchema),
    defaultValues: { channel: "" },
  });

  const channelValue = watch("channel");

  const onSubmit = (data: ChannelFormData) => {
    switchChannel(data.channel);
  };

  const version = Constants.expoConfig?.version ?? "0.0.0";
  const buildNumber =
    Constants.expoConfig?.ios?.buildNumber ??
    Constants.expoConfig?.android?.versionCode?.toString() ??
    "?";
  const updateUrl = Constants.expoConfig?.updates?.url ?? "Not set";

  return (
    <View className="items-center gap-3">
      <Pressable onPress={handleVersionTap}>
        <AppText size="xs" color="muted" align="center">
          v{version} ({buildNumber})
        </AppText>
      </Pressable>

      {isVisible && (
        <Card className="w-full bg-surface p-4">
          <Card.Body className="gap-4">
            {/* Header */}
            <View className="flex-row items-center justify-between">
              <AppText size="sm" weight="bold" family="headline">
                Channel Surfing
              </AppText>
              <Pressable onPress={hidePanel}>
                <AppText size="xs" color="muted">
                  Close
                </AppText>
              </Pressable>
            </View>

            {/* Update Details */}
            <View className="gap-1 rounded-lg bg-default p-3">
              <View className="flex-row justify-between">
                <AppText size="xs" color="muted">
                  Endpoint
                </AppText>
                <AppText
                  size="xs"
                  family="mono"
                  numberOfLines={1}
                  className="ml-2 flex-1 text-right"
                >
                  {updateUrl}
                </AppText>
              </View>
              <View className="flex-row justify-between">
                <AppText size="xs" color="muted">
                  Channel
                </AppText>
                <AppText size="xs" weight="semibold" family="mono">
                  {activeChannel}
                </AppText>
              </View>
              <View className="flex-row justify-between">
                <AppText size="xs" color="muted">
                  Build
                </AppText>
                <AppText size="xs" family="mono">
                  {buildNumber}
                </AppText>
              </View>
            </View>

            {/* Check for Update */}
            <Button
              variant="secondary"
              size="sm"
              onPress={checkForUpdate}
              isDisabled={isSwitching}
            >
              <Button.Label>Check for Update</Button.Label>
            </Button>

            <Separator />

            {/* Channel Input */}
            {isSwitching ? (
              <View className="items-center gap-2 py-4">
                <ActivityIndicator />
                <AppText size="xs" color="muted">
                  Switching channel...
                </AppText>
              </View>
            ) : (
              <View className="gap-3">
                <Controller
                  control={control}
                  name="channel"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField isInvalid={!!errors.channel}>
                      <Input
                        placeholder="Channel name (empty = main)"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                      />
                      {errors.channel && (
                        <FieldError>{errors.channel.message}</FieldError>
                      )}
                    </TextField>
                  )}
                />
                <Button
                  variant="primary"
                  onPress={handleSubmit(onSubmit)}
                >
                  <Button.Label>
                    {channelValue?.trim()
                      ? `Surf → ${channelValue.trim()}`
                      : "Reset to main"}
                  </Button.Label>
                </Button>
              </View>
            )}

            <Separator />

            {/* Logs Toggle */}
            <View className="flex-row items-center justify-between">
              <Pressable onPress={() => setShowLogs(!showLogs)}>
                <AppText size="xs" color="primary" weight="medium">
                  {showLogs ? "Hide Logs" : `View Logs (${logs.length})`}
                </AppText>
              </Pressable>
              {logs.length > 0 && (
                <Pressable onPress={clearLogs}>
                  <AppText size="xs" color="muted">
                    Clear
                  </AppText>
                </Pressable>
              )}
            </View>

            {/* Log Viewer */}
            {showLogs && logs.length > 0 && (
              <ScrollView
                className="max-h-48 rounded-lg bg-default p-3"
                nestedScrollEnabled
              >
                {logs.map((log, i) => (
                  <View
                    key={`${log.timestamp}-${i}`}
                    className="flex-row gap-2 py-0.5"
                  >
                    <AppText size="xs" color="muted" family="mono">
                      {log.timestamp}
                    </AppText>
                    <AppText
                      size="xs"
                      color={LOG_COLORS[log.type]}
                      family="mono"
                      className="flex-1"
                    >
                      {log.message}
                    </AppText>
                  </View>
                ))}
              </ScrollView>
            )}

            {logs.length === 0 && showLogs && (
              <AppText size="xs" color="muted" align="center">
                No logs yet.
              </AppText>
            )}
          </Card.Body>
        </Card>
      )}
    </View>
  );
};
