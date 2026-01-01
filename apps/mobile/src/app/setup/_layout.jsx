import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="intent" />
      <Stack.Screen name="intensity" />
      <Stack.Screen name="skillcheck" />
    </Stack>
  );
}
