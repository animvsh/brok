import React from "react";
import { View, TouchableOpacity, Text, Animated } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/components/useTheme";

export default function AppHeader({
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  onLeftPress,
  onRightPress,
  title,
  showProgress = false,
  progress = 0,
  target = 1,
  scrollY,
  children,
}) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const headerBorderOpacity = scrollY
    ? scrollY.interpolate({
        inputRange: [0, 50],
        outputRange: [0, 1],
        extrapolate: "clamp",
      })
    : 0;

  return (
    <Animated.View
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: theme.background,
        paddingTop: insets.top + 16,
        paddingBottom: 16,
        paddingHorizontal: 20,
        zIndex: 10,
        borderBottomWidth: 1,
        borderBottomColor: scrollY
          ? headerBorderOpacity.interpolate({
              inputRange: [0, 1],
              outputRange: ["rgba(0,0,0,0)", theme.headerBorder],
            })
          : theme.headerBorder,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginBottom: title || showProgress ? 20 : 0,
        }}
      >
        {LeftIcon ? (
          <TouchableOpacity
            onPress={onLeftPress}
            style={{
              width: 48,
              height: 48,
              backgroundColor: theme.iconBackground,
              borderRadius: 16,
              borderWidth: title ? 0 : 1,
              borderColor: theme.border,
              justifyContent: "center",
              alignItems: "center",
            }}
            accessibilityRole="button"
          >
            <LeftIcon size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}

        {RightIcon ? (
          <TouchableOpacity
            onPress={onRightPress}
            style={{
              width: 48,
              height: 48,
              backgroundColor: theme.iconBackground,
              borderRadius: 16,
              borderWidth: title ? 0 : 1,
              borderColor: theme.border,
              justifyContent: "center",
              alignItems: "center",
            }}
            accessibilityRole="button"
          >
            <RightIcon size={24} color={theme.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {(title || showProgress) && (
        <View>
          {title && (
            <Text
              style={{
                fontFamily: "Urbanist_600SemiBold",
                fontSize: 24,
                color: theme.text,
                marginBottom: showProgress ? 8 : 0,
              }}
            >
              {title}
            </Text>
          )}

          {showProgress && (
            <View>
              <Text
                style={{
                  fontFamily: "Urbanist_400Regular",
                  fontSize: 14,
                  color: theme.progressText,
                  marginBottom: 12,
                }}
              >
                Progress:{" "}
                <Text style={{ color: theme.progressText }}>{progress}</Text>
                <Text style={{ color: theme.progressSecondary }}>
                  /{target} lessons
                </Text>
              </Text>

              <View
                style={{
                  width: "100%",
                  height: 6,
                  backgroundColor: theme.progressBackground,
                  borderRadius: 3,
                  overflow: "hidden",
                }}
              >
                <Animated.View
                  style={{
                    width: `${(progress / target) * 100}%`,
                    height: "100%",
                    backgroundColor: theme.progressFill,
                  }}
                />
              </View>
            </View>
          )}
        </View>
      )}

      {children}
    </Animated.View>
  );
}
