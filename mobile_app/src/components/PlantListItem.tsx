import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Planta } from '../types';

interface PlantListItemProps {
  planta: Planta;
  onPress: () => void; // Função para lidar com o clique no item
}

const PlantListItem: React.FC<PlantListItemProps> = ({ planta, onPress }) => {
  // Mostra o nome personalizado da planta ou o nome comum da espécie como fallback
  const displayName = planta.nome || planta.especie.nomeComum || 'Planta sem nome';
  const speciesName = planta.especie.nomeCientifico;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      {/* <Image source={{ uri: 'url_da_imagem_aqui' }} style={styles.image} /> */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.species}>{speciesName}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    marginHorizontal: 5,
    flexDirection: 'row',
    alignItems: 'center',
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Sombra para Android
    elevation: 3,
  },
  // Placeholder para a imagem da planta (vamos implementar no futuro)
  // image: {
  //   width: 60,
  //   height: 60,
  //   borderRadius: 8,
  //   marginRight: 15,
  // },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  species: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
});

export default PlantListItem;