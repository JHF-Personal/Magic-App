import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text
} from "react-native";

export default function DatabaseDebug() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Database Debug</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
});
