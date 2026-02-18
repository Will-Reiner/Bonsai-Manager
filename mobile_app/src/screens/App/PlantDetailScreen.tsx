import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Alert, TouchableOpacity, Image, ScrollView as HScrollView } from 'react-native';
import { RouteProp, useRoute, useFocusEffect, useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { plantaService } from '../../services/plantaService';
import { agendaService } from '../../services/agendaService';
import { fotoService } from '../../services/fotoService';
import { Planta, Agenda, Foto } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import HistoryListItem from '../../components/HistoryListItem';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../constants/theme';
import { SERVER_URL } from '../../api';

type PlantDetailScreenRouteProp = RouteProp<RootStackParamList, 'PlantDetail'>;
type PlantDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlantDetail'>;

const PlantDetailScreen = () => {
  const route = useRoute<PlantDetailScreenRouteProp>();
  const navigation = useNavigation<PlantDetailNavigationProp>();
  const { plantaId } = route.params;

  const [planta, setPlanta] = useState<Planta | null>(null);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!plantaId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // 1. Busca os dados da planta
      const dataPlanta = await plantaService.getPlantaById(plantaId);
      setPlanta(dataPlanta);

      // 2. Busca TODA a agenda do usuário. No futuro, uma rota de API otimizada seria melhor.
      const todosAgendamentos = await agendaService.getMinhaAgenda();
      
      // 3. Filtra a agenda para mostrar apenas itens desta planta
      const agendaDaPlanta = todosAgendamentos.filter(item => item.plantaId === plantaId);
      setAgenda(agendaDaPlanta);

      // 4. Busca fotos da planta
      try {
        const fotosData = await fotoService.getFotosPorPlanta(plantaId);
        setFotos(fotosData);
      } catch {
        // Fotos são opcionais, não bloqueia o carregamento
      }

    } catch (err) {
      setError('Erro ao carregar os dados da planta.');
      Alert.alert('Erro', 'Não foi possível carregar os dados completos da planta.');
    } finally {
      setIsLoading(false);
    }
  }, [plantaId]);

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [carregarDados])
  );
  
  // Usamos useMemo para filtrar o histórico apenas quando a agenda mudar.
  // Isso é mais eficiente do que filtrar a cada renderização.
  const historico = useMemo(() => {
    return agenda.filter(item => item.status === 'CONCLUIDO')
                 .sort((a, b) => new Date(b.dataConcluida!).getTime() - new Date(a.dataConcluida!).getTime());
  }, [agenda]);

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para adicionar fotos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (result.canceled) return;

    setIsUploading(true);
    try {
      const newFoto = await fotoService.uploadFoto(result.assets[0].uri, plantaId);
      setFotos(prev => [newFoto, ...prev]);
    } catch {
      Alert.alert('Erro', 'Não foi possível fazer upload da foto.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeletePhoto = (fotoId: string) => {
    Alert.alert('Apagar Foto', 'Tem a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await fotoService.deleteFoto(fotoId);
            setFotos(prev => prev.filter(f => f.id !== fotoId));
          } catch {
            Alert.alert('Erro', 'Não foi possível apagar a foto.');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem a certeza que deseja apagar esta planta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar',
          style: 'destructive',
          onPress: async () => {
            try {
              await plantaService.deletePlanta(plantaId);
              Alert.alert('Sucesso', 'Planta apagada com sucesso.');
              navigation.goBack();
            } catch (err) {
              Alert.alert('Erro', 'Não foi possível apagar a planta.');
            }
          },
        },
      ]
    );
  };
  const handleEdit = () => navigation.navigate('EditPlant', { plantaId });
  const handleSchedule = () => navigation.navigate('ScheduleCare', { plantaId });

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (error || !planta) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error || 'Planta não encontrada.'}</Text></View>;
  }

  const renderDetailRow = (label: string, value?: string | null | Date) => {
    if (!value) return null;
    const displayValue = value instanceof Date ? value.toLocaleDateString('pt-BR') : value;
    return (
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{displayValue}</Text>
      </View>
    );
  };

  const ListHeader = () => (
    <>
      <View style={styles.header}>
        <Text style={styles.mainTitle}>{planta.nome || planta.especie.nomeComum}</Text>
        {planta.especie.nomeCientifico && <Text style={styles.subtitle}>{planta.especie.nomeCientifico}</Text>}
      </View>
      <View style={styles.card}>
        {renderDetailRow('Modo de Aquisição', planta.modoAquisicao)}
        {renderDetailRow('Data de Aquisição', planta.dataAquisicao ? new Date(planta.dataAquisicao) : null)}
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Notas e Visão de Futuro</Text>
        {renderDetailRow('Visão', planta.visao)}
        {renderDetailRow('Observações', planta.observacoes)}
      </View>
      <View style={styles.card}>
        <View style={styles.photoHeaderRow}>
          <Text style={styles.cardTitle}>Fotos</Text>
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator size="small" color={theme.colors.card} />
            ) : (
              <Text style={styles.addPhotoButtonText}>+ Adicionar</Text>
            )}
          </TouchableOpacity>
        </View>
        {fotos.length > 0 ? (
          <HScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {fotos.map((foto) => (
              <TouchableOpacity key={foto.id} onLongPress={() => handleDeletePhoto(foto.id)} style={styles.photoItem}>
                <Image
                  source={{ uri: `${SERVER_URL}${foto.caminhoArquivo}` }}
                  style={styles.photoImage}
                />
                {foto.titulo ? <Text style={styles.photoTitle} numberOfLines={1}>{foto.titulo}</Text> : null}
              </TouchableOpacity>
            ))}
          </HScrollView>
        ) : (
          <Text style={styles.emptyPhotoText}>Nenhuma foto adicionada.</Text>
        )}
      </View>
    </>
  );
  
  const ListFooter = () => (
    <View style={styles.actionsContainer}>
        <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
            <Text style={styles.actionButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.scheduleButton]} onPress={handleSchedule}>
            <Text style={styles.actionButtonText}>Agendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Text style={styles.actionButtonText}>Apagar</Text>
        </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
        style={styles.container}
        data={historico}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <HistoryListItem item={item} />} // Passamos o item da agenda para o HistoryListItem
        ListHeaderComponent={
            <>
                <ListHeader />
                <View style={styles.historyHeader}>
                    <Text style={styles.cardTitle}>Histórico de Cuidados (Concluídos)</Text>
                </View>
            </>
        }
        ListFooterComponent={ListFooter}
        ListEmptyComponent={
            <View style={styles.centeredEmpty}>
                <Text>Nenhum registo de histórico para esta planta.</Text>
            </View>
        }
    />
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
        backgroundColor: theme.colors.background
    },
    centeredEmpty: { 
        padding: theme.spacing.lg, 
        alignItems: 'center' 
    },
    header: { 
        backgroundColor: theme.colors.card, 
        padding: theme.spacing.lg, 
        borderBottomWidth: 1, 
        borderBottomColor: theme.colors.lightGray 
    },
    mainTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: theme.colors.text 
    },
    subtitle: { 
        fontSize: 18, 
        fontStyle: 'italic', 
        color: theme.colors.subtext, 
        marginTop: theme.spacing.xs 
    },
    card: { 
        backgroundColor: theme.colors.card, 
        padding: theme.spacing.lg, 
        marginHorizontal: theme.spacing.md, 
        marginTop: theme.spacing.md, 
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    historyHeader: { 
        marginTop: theme.spacing.lg, 
        paddingHorizontal: theme.spacing.lg, 
        paddingBottom: theme.spacing.sm 
    },
    cardTitle: { 
        fontSize: 18, 
        fontWeight: 'bold', 
        color: theme.colors.text 
    },
    detailRow: { 
        marginBottom: theme.spacing.sm 
    },
    detailLabel: { 
        fontSize: 14, 
        color: theme.colors.subtext, 
        marginBottom: theme.spacing.xs 
    },
    detailValue: { 
        fontSize: 16, 
        color: theme.colors.text 
    },
    errorText: { 
        fontSize: 16, 
        color: theme.colors.danger 
    },
    actionsContainer: { 
        flexDirection: 'row', 
        justifyContent: 'space-around', 
        padding: theme.spacing.lg, 
        marginTop: theme.spacing.sm 
    },
    actionButton: { 
        backgroundColor: theme.colors.primary, 
        paddingVertical: theme.spacing.sm, 
        paddingHorizontal: theme.spacing.lg, 
        borderRadius: 8, 
        alignItems: 'center', 
        flex: 1, 
        marginHorizontal: theme.spacing.xs 
    },
    scheduleButton: { 
        backgroundColor: theme.colors.accent 
    },
    deleteButton: { 
        backgroundColor: theme.colors.danger 
    },
    actionButtonText: {
        color: theme.colors.card,
        fontSize: 16,
        fontWeight: 'bold'
    },
    photoHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    addPhotoButton: {
        backgroundColor: theme.colors.primary,
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },
    addPhotoButtonText: {
        color: theme.colors.card,
        fontWeight: 'bold',
        fontSize: 13,
    },
    photoScroll: {
        marginTop: theme.spacing.xs,
    },
    photoItem: {
        marginRight: theme.spacing.sm,
        alignItems: 'center',
    },
    photoImage: {
        width: 120,
        height: 120,
        borderRadius: 8,
        backgroundColor: theme.colors.lightGray,
    },
    photoTitle: {
        fontSize: 12,
        color: theme.colors.subtext,
        marginTop: 4,
        maxWidth: 120,
    },
    emptyPhotoText: {
        color: theme.colors.subtext,
        fontSize: 14,
        textAlign: 'center',
        paddingVertical: theme.spacing.sm,
    },
});

export default PlantDetailScreen;