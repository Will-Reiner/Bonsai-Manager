import React from 'react';
import { TouchableOpacity, Image, View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Planta } from '../types';
import { theme } from '../constants/theme';
import { resolveMediaUri } from '../utils/resolveMediaUri';
import { calculatePlantAge } from '../utils/dateHelpers';

interface PlantCollectionCardProps {
  planta: Planta;
  usaIdentificador: boolean;
  usaNome: boolean;
  /** Quantidade de tarefas pendentes para hoje + atrasadas. */
  pendingCount: number;
  onPress: () => void;
}

const PlantCollectionCard: React.FC<PlantCollectionCardProps> = ({
  planta,
  usaIdentificador,
  usaNome,
  pendingCount,
  onPress,
}) => {
  const showId = usaIdentificador && !!planta.identificador;
  const showNome = usaNome && !!planta.nome;
  const fallback = planta.nome || planta.especie?.nomeComum || 'Sem nome';

  const species = planta.especie?.nomeComum || planta.especie?.nomeCientifico || '';
  const age = calculatePlantAge(planta.dataAquisicao);
  const showAge = age !== 'Desconhecida';

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.85}>
      {/* Foto + badge de pendências */}
      <View style={styles.imageWrap}>
        {planta.fotoCapaUrl ? (
          <Image
            source={{ uri: resolveMediaUri(planta.fotoCapaUrl) }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <MaterialCommunityIcons name="leaf" size={40} color={theme.colors.primary} />
          </View>
        )}
        {pendingCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pendingCount}</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        {/* ID e/ou nome (conforme preferência) */}
        <View style={styles.primaryRow}>
          {showId && (
            <View style={styles.idPill}>
              <MaterialCommunityIcons name="tag-outline" size={11} color={theme.colors.primaryDark} />
              <Text style={styles.idText} numberOfLines={1}>{planta.identificador}</Text>
            </View>
          )}
          {showNome && (
            <Text style={styles.nameText} numberOfLines={1}>{planta.nome}</Text>
          )}
          {!showId && !showNome && (
            <Text style={styles.nameText} numberOfLines={1}>{fallback}</Text>
          )}
        </View>

        {/* Espécie + idade (texto menor) */}
        {(species || showAge) && (
          <View style={styles.secondaryRow}>
            <Text style={styles.species} numberOfLines={1}>{species}</Text>
            {showAge && <Text style={styles.age}>{age}</Text>}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.shadows.soft,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: theme.colors.lightGray,
  },
  placeholder: {
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.urgent,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: theme.colors.card,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    padding: theme.spacing.sm,
  },
  primaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: '100%',
  },
  idText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primaryDark,
  },
  nameText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  secondaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
    gap: 6,
  },
  species: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.subtext,
    fontStyle: 'italic',
  },
  age: {
    fontSize: 12,
    color: theme.colors.subtext,
    fontWeight: '500',
  },
});

export default PlantCollectionCard;
