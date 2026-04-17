import { View } from "react-native";
import { Card, Skeleton } from "heroui-native";
import { AppText } from "@/components/atoms/Text";
import { Sparkle } from "phosphor-react-native";
import { useCSSVariable } from "uniwind";
import { useAIStore } from "@/stores/useAIStore";
import { useIsAIAvailable } from "@/hooks/useIsAIAvailable";
import { useDayInsight } from "@/hooks/useDayInsight";
import { formatBytes } from "@/services/localAI";

export const DayInsight = () => {
  const isAIAvailable = useIsAIAvailable();
  const aiStatus = useAIStore((s) => s.status);
  const downloadProgress = useAIStore((s) => s.downloadProgress);
  const downloadedBytes = useAIStore((s) => s.downloadedBytes);
  const totalBytes = useAIStore((s) => s.totalBytes);
  const [primaryColor] = useCSSVariable(["--color-primary"]);

  const { insight, isGenerating } = useDayInsight();

  if (!isAIAvailable) return null;

  if (aiStatus === "downloading") {
    return (
      <Card className="bg-primary/5 p-4">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Sparkle size={14} weight="fill" color={primaryColor as string} />
            <AppText size="xs" color="primary" weight="medium">
              clawdi Day Planner
            </AppText>
          </View>
          <AppText size="xs" color="muted">
            Downloading AI model...
          </AppText>
          <View className="h-1.5 overflow-hidden rounded-full bg-default">
            <View
              className="h-full rounded-full bg-primary"
              style={{ width: `${Math.round(downloadProgress * 100)}%` }}
            />
          </View>
          <AppText size="xs" color="muted">
            {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
          </AppText>
        </Card.Body>
      </Card>
    );
  }

  if (isGenerating || aiStatus === "inferring") {
    return (
      <Card className="bg-primary/5 p-4">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Sparkle size={14} weight="fill" color={primaryColor as string} />
            <AppText size="xs" color="primary" weight="medium">
              clawdi Day Planner
            </AppText>
          </View>
          <Skeleton className="h-3 w-3/4 rounded" />
          <Skeleton className="h-3 w-1/2 rounded" />
        </Card.Body>
      </Card>
    );
  }

  if (insight) {
    return (
      <Card className="bg-primary/5 p-4">
        <Card.Body className="gap-2">
          <View className="flex-row items-center gap-2">
            <Sparkle size={14} weight="fill" color={primaryColor as string} />
            <AppText size="xs" color="primary" weight="medium">
              clawdi Day Planner
            </AppText>
          </View>
          <AppText size="sm" style={{ lineHeight: 22 }}>
            {insight}
          </AppText>
        </Card.Body>
      </Card>
    );
  }

  return null;
};
