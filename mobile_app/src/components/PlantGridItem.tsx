import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Planta } from '../types';
import { theme } from '../constants/theme';
import { resolveMediaUri } from '../utils/resolveMediaUri';

interface PlantGridItemProps {
  planta: Planta;
  onPress: () => void;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const ITEM_WIDTH = (SCREEN_WIDTH - theme.spacing.md * 3) / 2;
const IMAGE_HEIGHT = ITEM_WIDTH * 0.85;

const PlantGridItem: React.FC<PlantGridItemProps> = ({ planta, onPress }) => {
  const displayName = planta.nome || planta.especie?.nomeComum || 'Sem nome';
  const speciesName = planta.especie?.nomeCientifico || planta.especie?.nomeComum || '';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {planta.fotoCapaUrl ? (
        <Image
          source={{ uri: resolveMediaUri(planta.fotoCapaUrl) }}
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons name="leaf" size={40} color={theme.colors.primaryLight} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
        {speciesName ? (
          <Text style={styles.species} numberOfLines={1}>{speciesName}</Text>
        ) : null}
        <Text style={styles.id}>#{planta.id.slice(0, 6)}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ITEM_WIDTH,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  image: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: theme.colors.lightGray,
  },
  placeholder: {
    width: '100%',
    height: IMAGE_HEIGHT,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: theme.spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  species: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontStyle: 'italic',
    marginTop: 2,
  },
  id: {
    fontSize: 11,
    color: theme.colors.border,
    marginTop: 2,
  },
});

export default PlantGridItem;
