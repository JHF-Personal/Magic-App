import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Deck, DeckContextType } from '../types/deck';
import { databaseService } from '../services/databaseService';

const DeckContext = createContext<DeckContextType | undefined>(undefined);

interface DeckProviderProps {
  children: ReactNode;
}

export function DeckProvider({ children }: DeckProviderProps) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<Deck | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load decks from database on mount
  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const fetchedDecks = await databaseService.getAllDecks();
      setDecks(fetchedDecks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load decks');
      console.error('Error loading decks:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const selectDeck = async (deckId: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const deck = await databaseService.getDeckById(deckId);
      setSelectedDeck(deck);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
      console.error('Error selecting deck:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedDeck(null);
    setError(null);
  };

  const refreshDecks = async () => {
    await loadDecks();
  };

  const createDeck = async (deck: Omit<Deck, 'id' | 'created_at' | 'updated_at' | 'wins' | 'losses' | 'total_games'>): Promise<Deck> => {
    try {
      setIsLoading(true);
      setError(null);
      const newDeck = await databaseService.createDeck(deck);
      await loadDecks(); // Refresh the list
      return newDeck;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create deck');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDeck = async (deck: Deck): Promise<Deck> => {
    try {
      setIsLoading(true);
      setError(null);
      const updatedDeck = await databaseService.updateDeck(deck);
      await loadDecks(); // Refresh the list
      if (selectedDeck?.id === deck.id) {
        setSelectedDeck(updatedDeck);
      }
      return updatedDeck;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deck');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDeck = async (id: number): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      await databaseService.deleteDeck(id);
      await loadDecks(); // Refresh the list
      if (selectedDeck?.id === id) {
        setSelectedDeck(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete deck');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const value: DeckContextType = {
    decks,
    selectedDeck,
    selectDeck,
    clearSelection,
    isLoading,
    error,
    refreshDecks,
    createDeck,
    updateDeck,
    deleteDeck,
  };

  return (
    <DeckContext.Provider value={value}>
      {children}
    </DeckContext.Provider>
  );
}

export function useDeck(): DeckContextType {
  const context = useContext(DeckContext);
  if (context === undefined) {
    throw new Error('useDeck must be used within a DeckProvider');
  }
  return context;
}