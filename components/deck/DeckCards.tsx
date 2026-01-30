// TODO UNCOMMENT AND FIX WITH NEW TYPES


import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from '../../types/deck';

interface DeckCardsProps {
  cards: Card[];
}

interface CardItemProps {
  card: Card;
}

function CardItem({ card }: CardItemProps) {
  const getRarityColor = (rarity: string) => {
    switch (rarity.toLowerCase()) {
      case 'common': return '#95a5a6';
      case 'uncommon': '#f39c12';
      case 'rare': return '#f1c40f';
      case 'mythic': return '#e74c3c';
      default: return '#bdc3c7';
    }
  };

  return (
    <View style={styles.cardItem}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardName}>{card.name}</Text>
        <View style={styles.cardMeta}>
          {/* <Text style={styles.cardCost}>{card.cost}</Text>
          <Text style={styles.cardQuantity}>×{card.quantity}</Text> */}
        </View>
      </View>
      <View style={styles.cardDetails}>
        {/* <Text style={styles.cardType}>{card.type}</Text> */}
        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(card.rarity) }]}>
          <Text style={styles.rarityText}>{card.rarity}</Text>
        </View>
      </View>
    </View>
  );
}

export default function DeckCards({ cards }: DeckCardsProps) {
  // const totalCards = cards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {/* <Text style={styles.title}>Cards ({totalCards})</Text> */}
      </View>
      
      <FlatList
        data={cards}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CardItem card={item} />}
        scrollEnabled={false}
        contentContainerStyle={styles.cardsList}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  header: {
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cardsList: {
    gap: 10,
  },
  cardItem: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#0066cc',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardCost: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0066cc',
    backgroundColor: '#e6f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    textAlign: 'center',
  },
  cardQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardType: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  rarityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'capitalize',
  },
});