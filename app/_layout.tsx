import { Stack } from "expo-router";
import { DeckProvider } from "../contexts/DeckContext";

export default function RootLayout() {
  return (
    <DeckProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="deck" options={{ title: "Deck Details", presentation: "modal" }} />
        <Stack.Screen name="debug" options={{ title: "Database Debug", presentation: "modal" }} />
      </Stack>
    </DeckProvider>
  );
}
