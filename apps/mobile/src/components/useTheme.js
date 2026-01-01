import { useColorScheme } from "react-native";

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return {
    isDark,
    background: isDark ? "#121212" : "#FFFFFF",
    cardBackground: isDark ? "#1E1E1E" : "#FFFFFF",
    elevatedCard: isDark ? "#262626" : "#FAFAFA",
    emptyStateCard: isDark ? "#1A1A1A" : "#F8F8F8",
    text: isDark ? "rgba(255,255,255,0.87)" : "#000000",
    secondaryText: isDark ? "rgba(255,255,255,0.60)" : "#8C8C8C",
    tertiaryText: isDark ? "rgba(255,255,255,0.38)" : "#999999",
    border: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.05)",
    headerBorder: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
    iconBackground: isDark ? "#2A2A2A" : "#FFFFFF",
    progressBackground: isDark ? "#2A2A2A" : "#F1F1F1",
    progressFill: isDark ? "#FFFFFF" : "#000000",
    progressText: isDark ? "rgba(255,255,255,0.87)" : "#000000",
    progressSecondary: isDark ? "rgba(255,255,255,0.60)" : "rgba(0,0,0,0.6)",
    accent: isDark ? "#1A1A1A" : "#000000",
    accentText: isDark ? "rgba(255,255,255,0.87)" : "#FFFFFF",
    emptyStateIcon: isDark ? "#555555" : "#E8E8E8",
    emptyStateIconColor: isDark ? "#777777" : "#AAAAAA",
    emptyStateTitle: isDark ? "rgba(255,255,255,0.60)" : "#666666",
    emptyStateDescription: isDark ? "rgba(255,255,255,0.38)" : "#999999",
    audioButton: isDark ? "#FFFFFF" : "#000000",
    audioButtonIcon: isDark ? "#000000" : "#FFFFFF",
    selectedChip: isDark ? "#FFFFFF" : "#000000",
    selectedChipText: isDark ? "#000000" : "#FFFFFF",
    unselectedChip: isDark ? "#2A2A2A" : "#F5F5F5",
    unselectedChipText: isDark ? "rgba(255,255,255,0.87)" : "#000000",
  };
}
