import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { recursoService } from '../../services/recursoService';
import { Recurso } from '../../types';
import ResourceListItem from '../../components/ResourceListItem';
import ResourceModal from '../../components/ResourceModal';
import { theme } from '../../constants/theme';

const InventoryScreen = () => {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRecurso, setSelectedRecurso] = useState<Recurso | null>(null);

  const carregarRecursos = useCallback(async () => {
    try {
      setError(null);
      const data = await recursoService.getMeusRecursos();
      setRecursos(data);
    } catch (err) {
      setError('Não foi possível carregar o seu inventário.');
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setIsLoading(true);
    carregarRecursos().finally(() => setIsLoading(false));
  }, [carregarRecursos]));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await carregarRecursos();
    setIsRefreshing(false);
  };

  const handleOpenAddModal = () => {
    setSelectedRecurso(null);
    setIsModalVisible(true);
  };
  
  const handleOpenEditModal = (recurso: Recurso) => {
    setSelectedRecurso(recurso);
    setIsModalVisible(true);
  };
  
  const handleDelete = (recurso: Recurso) => {
      Alert.alert(
          "Confirmar Exclusão",
          `Tem a certeza que deseja apagar "${recurso.tipoRecurso.nome}" do seu inventário?`,
          [
              { text: "Cancelar", style: "cancel" },
              { text: "Apagar", style: "destructive", onPress: async () => {
                  try {
                      await recursoService.deleteRecurso(recurso.id);
                      Alert.alert("Sucesso", "Recurso apagado.");
                      forceUpdate();
                  } catch (e) {
                      Alert.alert("Erro", "Não foi possível apagar o recurso.");
                  }
              }}
          ]
      )
  };

  const forceUpdate = () => {
    setIsModalVisible(false);
    setIsLoading(true);
    carregarRecursos().finally(() => setIsLoading(false));
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.infoText}>A carregar o seu inventário...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={handleRefresh}>
            <Text style={styles.buttonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (recursos.length === 0) {
      return (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Seu inventário está vazio.</Text>
          <Text style={styles.emptySubtext}>Adicione recursos para começar a organizar seu inventário!</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={recursos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ResourceListItem recurso={item} onEdit={() => handleOpenEditModal(item)} onDelete={() => handleDelete(item)}/>}
        onRefresh={handleRefresh}
        refreshing={isRefreshing}
        contentContainerStyle={styles.list}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Meu Inventário</Text>
        <TouchableOpacity onPress={handleOpenAddModal} style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {renderContent()}

      <ResourceModal 
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        onSave={forceUpdate}
        recursoToEdit={selectedRecurso}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: theme.spacing.large 
  },
  infoText: {
    marginTop: theme.spacing.small,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.subtext,
  },
  list: {
    paddingVertical: theme.spacing.small,
  },
  errorText: { 
    fontSize: theme.typography.body.fontSize, 
    color: theme.colors.danger,
    marginBottom: theme.spacing.large,
    textAlign: 'center',
  },
  emptyText: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: theme.colors.text 
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: theme.spacing.small,
    textAlign: 'center',
  },
  button: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: theme.colors.card,
    fontSize: theme.typography.body.fontSize,
    fontWeight: 'bold',
  },
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: theme.spacing.medium, 
    paddingVertical: theme.spacing.small, 
    backgroundColor: theme.colors.card, 
    borderBottomWidth: 1, 
    borderBottomColor: theme.colors.lightGray 
  },
  headerTitle: { 
    fontSize: theme.typography.h2.fontSize, 
    fontWeight: theme.typography.h2.fontWeight as any,
    color: theme.colors.text,
  },
  addButton: { 
    backgroundColor: theme.colors.primary, 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  addButtonText: { 
    color: theme.colors.card, 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
});

export default InventoryScreen;