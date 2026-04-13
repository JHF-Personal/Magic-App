import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Index() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Magic App</Text>
      <Pressable
        style={styles.button}
        onPress={() => router.push("/add_deck" as never)}
      >
        <Text style={styles.buttonText}>Go to Add Deck</Text>
      </Pressable>
      <Pressable
        style={styles.button}
        onPress={() => router.push("/debug" as never)}
      >
        <Text style={styles.buttonText}>Debug</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#171612",
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "#1B1B18",
    backgroundColor: "#1F5C47",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#F7F3E8",
  },
});
