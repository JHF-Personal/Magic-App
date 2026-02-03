import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Deck } from '../../types/deck';
import DeckStats from './DeckStats';

interface DeckViewProps {
  deck: Deck;
}

export default function DeckView({ deck }: DeckViewProps) {
  return (
    <ScrollView style={styles.container}>
      {/* --- Deck Header --- */}
      <View style={styles.header}>
        {/* --- Deck Name --- */}
        <Text style={styles.title}>{deck.name}</Text>
        {/* --- Deck Colors --- */}
        <View style={styles.colorsContainer}>
          {deck.colors.map((color, index) => (
            <View key={index} style={[styles.colorBadge, { backgroundColor: getColorHex(color) }]}>
              <Text style={styles.colorText}>{color[0].toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>
      
      {/* --- Deck Description --- */}
      {deck.description && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.description}>{deck.description}</Text>
        </View>
      )}

      {/* --- Deck Statistics --- */}
      <DeckStats deck={deck} />
    </ScrollView>
  );
}

function getColorHex(color: string): string {
  const colorMap: { [key: string]: string } = {
    white: '#FFFBD5',
    blue: '#0E68AB',
    black: '#150B00',
    red: '#D3202A',
    green: '#00733E',
  };
  return colorMap[color.toLowerCase()] || '#999';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  colorsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  colorBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  colorText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  descriptionContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#666',
  },
});