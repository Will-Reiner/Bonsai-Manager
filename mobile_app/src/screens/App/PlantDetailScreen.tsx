import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView as HScrollView,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
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
import { resolveMediaUri } from '../../utils/resolveMediaUri';
import { calculatePlantAge } from '../../utils/dateHelpers';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { UploadProgressBar } from '../../components/UploadProgressBar';
import { DrawingEditor } from '../../components/DrawingEditor';
import ThreeDotsMenu from '../../components/ThreeDotsMenu';
import NextCareCard from '../../components/NextCareCard';
import SectionHeader from '../../components/SectionHeader';

type PlantDetailScreenRouteProp = RouteProp<RootStackParamList, 'PlantDetail'>;
type PlantDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlantDetail'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Componente separado para o player de vídeo
const VideoPlayerView = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, p => { p.play(); });
  return (
    <VideoView
      player={player}
      style={styles.mediaVideo}
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};

const PlantDetailScreen = () => {
  const route = useRoute<PlantDetailScreenRouteProp>();
  const navigation = useNavigation<PlantDetailNavigationProp>();
  const { plantaId } = route.params;

  const [planta, setPlanta] = useState<Planta | null>(null);
  const [agenda, setAgenda] = useState<Agenda[]>([]);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<Foto | null>(null);

  const { upload, isUploading, progress, phase, reset: resetUpload } = useMediaUpload();

  const [showDrawingEditor, setShowDrawingEditor] = useState(false);
  const [drawingBaseImage, setDrawingBaseImage] = useState<string>('');
  const [showBaseImagePicker, setShowBaseImagePicker] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!plantaId) return;
    setIsLoading(true);
    setError(null);
    try {
      const dataPlanta = await plantaService.getPlantaById(plantaId);
      setPlanta(dataPlanta);

      const todosAgendamentos = await agendaService.getMinhaAgenda();
      const agendaDaPlanta = todosAgendamentos.filter(item => item.plantaId === plantaId);
      setAgenda(agendaDaPlanta);

      try {
        const fotosData = await fotoService.getFotosPorPlanta(plantaId);
        setFotos(fotosData);
      } catch {
        // Fotos são opcionais
      }
    } catch (err) {
      setError('Erro ao carregar os dados da planta.');
    } finally {
      setIsLoading(false);
    }
  }, [plantaId]);

  useFocusEffect(useCallback(() => { carregarDados(); }, [carregarDados]));

  const historico = useMemo(() => {
    return agenda
      .filter(item => item.status === 'CONCLUIDO')
      .sort((a, b) => new Date(b.dataConcluida!).getTime() - new Date(a.dataConcluida!).getTime())
      .slice(0, 3);
  }, [agenda]);

  const visaoFutura = useMemo(() => {
    const visoes = fotos.filter(f => f.tipo === 'VISAO_FUTURA');
    return visoes.length > 0 ? visoes[0] : null;
  }, [fotos]);

  const fotosGaleria = useMemo(() => {
    return fotos.filter(f => f.tipo !== 'VISAO_FUTURA').slice(0, 4);
  }, [fotos]);

  // Próximas atividades agendadas (pendentes)
  const nextCareData = useMemo(() => {
    const pendentes = agenda
      .filter(a => a.status === 'PENDENTE')
      .sort((a, b) => new Date(a.dataAgendada).getTime() - new Date(b.dataAgendada).getTime());

    const find = (keyword: string) => {
      const item = pendentes.find(a => (a.atividade?.nome || '').toLowerCase().includes(keyword));
      return item ? item.dataAgendada : null;
    };

    return {
      adubacao: find('aduba'),
      transplante: find('transplant'),
      estilizacao: find('poda') || find('aramacao') || find('estiliza'),
    };
  }, [agenda]);

  const handleEdit = () => navigation.navigate('EditPlant', { plantaId });
  const handleSchedule = () => navigation.navigate('ScheduleCare', { plantaId });
  const handleDelete = () => {
    Alert.alert('Confirmar Exclusão', 'Tem a certeza que deseja apagar esta planta?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await plantaService.deletePlanta(plantaId);
            Alert.alert('Sucesso', 'Planta apagada com sucesso.');
            navigation.goBack();
          } catch {
            Alert.alert('Erro', 'Não foi possível apagar a planta.');
          }
        },
      },
    ]);
  };

  // Configure header com ThreeDotsMenu (deve ficar antes dos early returns)
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <ThreeDotsMenu items={[
          { label: 'Editar', icon: 'pencil', onPress: handleEdit },
          { label: 'Agendar', icon: 'calendar-plus', onPress: handleSchedule },
          { label: 'Apagar', icon: 'delete', onPress: handleDelete, destructive: true },
        ]} />
      ),
    });
  }, [navigation, plantaId]);

  const openDrawingEditor = () => {
    const fotosDisponiveis = fotos.filter(f => f.tipo === 'FOTO');
    if (fotosDisponiveis.length === 0) {
      Alert.alert('Sem fotos', 'Adicione pelo menos uma foto à planta para criar um esboço de visão.');
      return;
    }
    if (fotosDisponiveis.length === 1) {
      setDrawingBaseImage(resolveMediaUri(fotosDisponiveis[0].caminhoArquivo));
      setShowDrawingEditor(true);
    } else {
      setShowBaseImagePicker(true);
    }
  };

  const handleSelectBaseImage = (foto: Foto) => {
    setDrawingBaseImage(resolveMediaUri(foto.caminhoArquivo));
    setShowBaseImagePicker(false);
    setShowDrawingEditor(true);
  };

  const handleSaveDrawing = async (localImageUri: string, descricao: string) => {
    setShowDrawingEditor(false);
    try {
      const { publicUrl } = await upload(localImageUri, 'image/png');
      const newFoto = await fotoService.createFoto({
        caminhoArquivo: publicUrl,
        plantaId,
        tipo: 'VISAO_FUTURA',
        descricao: descricao || undefined,
        titulo: 'Visão de Futuro',
      });
      setFotos(prev => [newFoto, ...prev]);
      resetUpload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.';
      Alert.alert('Erro no upload', msg);
      resetUpload();
    }
  };

  const handleAddPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Precisamos de acesso à galeria para adicionar mídia.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images', 'videos'], quality: 1 });
    if (result.canceled) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';

    try {
      const { publicUrl, thumbnailUrl, tipo } = await upload(asset.uri, mimeType);
      const newFoto = await fotoService.createFoto({
        caminhoArquivo: publicUrl,
        plantaId,
        tipo: tipo === 'video' ? 'VIDEO' : 'FOTO',
        thumbnailUrl,
      });
      setFotos(prev => [newFoto, ...prev]);
      resetUpload();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido.';
      Alert.alert('Erro no upload', msg);
      resetUpload();
    }
  };

  const handleDeletePhoto = (fotoId: string) => {
    Alert.alert('Apagar Mídia', 'Tem a certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: async () => {
          try {
            await fotoService.deleteFoto(fotoId);
            setFotos(prev => prev.filter(f => f.id !== fotoId));
          } catch {
            Alert.alert('Erro', 'Não foi possível apagar a mídia.');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={theme.colors.primary} /></View>;
  }

  if (error || !planta) {
    return <View style={styles.centered}><Text style={styles.errorText}>{error || 'Planta não encontrada.'}</Text></View>;
  }

  const displayName = planta.nome || planta.especie?.nomeComum || 'Sem nome';
  const age = calculatePlantAge(planta.dataAquisicao);

  const ListHeader = () => (
    <>
      {/* Foto de capa full-width */}
      {planta.fotoCapaUrl ? (
        <Image
          source={{ uri: resolveMediaUri(planta.fotoCapaUrl) }}
          style={styles.coverImage}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Ionicons name="leaf" size={48} color={theme.colors.primaryLight} />
        </View>
      )}

      {/* Card de informações */}
      <View style={styles.infoCard}>
        <Text style={styles.plantName}>{displayName}</Text>
        {planta.especie?.nomeCientifico && (
          <Text style={styles.scientificName}>{planta.especie.nomeCientifico}</Text>
        )}
        <View style={styles.infoRow}>
          {planta.modoAquisicao && (
            <View style={styles.infoPill}>
              <Text style={styles.infoPillText}>{planta.modoAquisicao}</Text>
            </View>
          )}
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>{age}</Text>
          </View>
          <View style={styles.infoPill}>
            <Text style={styles.infoPillText}>#{planta.id.slice(0, 6)}</Text>
          </View>
        </View>
        {planta.observacoes && (
          <Text style={styles.observacoes}>{planta.observacoes}</Text>
        )}
      </View>

      {/* 3 Cards de próximas atividades */}
      <View style={styles.nextCareRow}>
        <NextCareCard label="Adubação" date={nextCareData.adubacao} icon="flask" />
        <NextCareCard label="Transplante" date={nextCareData.transplante} icon="shovel" />
        <NextCareCard label="Estilização" date={nextCareData.estilizacao} icon="content-cut" />
      </View>

      {/* Visão de Futuro */}
      <View style={styles.card}>
        <View style={styles.photoHeaderRow}>
          <Text style={styles.cardTitle}>Visão de Futuro</Text>
          <TouchableOpacity style={styles.smallButton} onPress={openDrawingEditor}>
            <Text style={styles.smallButtonText}>+ Criar Esboço</Text>
          </TouchableOpacity>
        </View>
        {visaoFutura ? (
          <View>
            <Image source={{ uri: resolveMediaUri(visaoFutura.caminhoArquivo) }} style={styles.visaoImage} />
            {visaoFutura.descricao ? <Text style={styles.visaoDescricao}>{visaoFutura.descricao}</Text> : null}
          </View>
        ) : (
          <Text style={styles.emptyPhotoText}>Nenhum esboço de visão criado.</Text>
        )}
      </View>

      {/* Seção Fotos */}
      <SectionHeader
        title="Fotos"
        actionLabel="Todas"
        onAction={() => navigation.navigate('PhotoGallery', { plantaId, plantaNome: displayName })}
      />

      <View style={styles.card}>
        <UploadProgressBar progress={progress} phase={phase} visible={isUploading} />
        {fotosGaleria.length > 0 ? (
          <View style={styles.photoGrid}>
            {fotosGaleria.map((foto) => (
              <TouchableOpacity
                key={foto.id}
                onPress={() => setSelectedMedia(foto)}
                onLongPress={() => handleDeletePhoto(foto.id)}
                style={styles.photoGridItem}
              >
                <Image
                  source={{ uri: foto.tipo === 'VIDEO' && foto.thumbnailUrl ? foto.thumbnailUrl : resolveMediaUri(foto.caminhoArquivo) }}
                  style={styles.photoGridImage}
                />
                {foto.tipo === 'VIDEO' && (
                  <View style={styles.playIconOverlay}>
                    <Ionicons name="play-circle" size={28} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyPhotoText}>Nenhuma mídia adicionada.</Text>
        )}
        <TouchableOpacity style={[styles.smallButton, { marginTop: theme.spacing.sm }]} onPress={handleAddPhoto} disabled={isUploading}>
          <Text style={styles.smallButtonText}>+ Adicionar</Text>
        </TouchableOpacity>
      </View>

      {/* Seção Histórico */}
      <SectionHeader
        title="Histórico"
        actionLabel="Todos"
        onAction={() => navigation.navigate('Tasks')}
      />
    </>
  );

  return (
    <>
      <FlatList
        style={styles.containerList}
        data={historico}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <HistoryListItem item={item} />}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          <View style={styles.centeredEmpty}>
            <Text style={styles.emptyPhotoText}>Nenhum registo de histórico para esta planta.</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.spacing.xl }}
      />

      {/* Seletor de foto base para o editor de desenho */}
      <Modal visible={showBaseImagePicker} transparent animationType="fade" onRequestClose={() => setShowBaseImagePicker(false)}>
        <View style={styles.mediaOverlay}>
          <View style={styles.baseImagePickerContainer}>
            <Text style={styles.baseImagePickerTitle}>Escolha uma foto como base</Text>
            <HScrollView horizontal showsHorizontalScrollIndicator={false}>
              {fotos.filter(f => f.tipo === 'FOTO').map((foto) => (
                <TouchableOpacity key={foto.id} style={styles.baseImagePickerItem} onPress={() => handleSelectBaseImage(foto)}>
                  <Image source={{ uri: resolveMediaUri(foto.caminhoArquivo) }} style={styles.baseImagePickerPhoto} />
                </TouchableOpacity>
              ))}
            </HScrollView>
            <TouchableOpacity style={styles.baseImagePickerCancel} onPress={() => setShowBaseImagePicker(false)}>
              <Text style={styles.baseImagePickerCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Editor de desenho */}
      <DrawingEditor
        visible={showDrawingEditor}
        imageUrl={drawingBaseImage}
        onSave={handleSaveDrawing}
        onClose={() => setShowDrawingEditor(false)}
      />

      {/* Viewer de mídia em tela cheia */}
      <Modal visible={!!selectedMedia} transparent animationType="fade" onRequestClose={() => setSelectedMedia(null)} statusBarTranslucent>
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
        <View style={styles.mediaOverlay}>
          <TouchableOpacity style={styles.mediaCloseBtn} onPress={() => setSelectedMedia(null)}>
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>
          {selectedMedia?.tipo === 'VIDEO' ? (
            <VideoPlayerView uri={resolveMediaUri(selectedMedia.caminhoArquivo)} />
          ) : selectedMedia ? (
            <Image
              source={{ uri: resolveMediaUri(selectedMedia.caminhoArquivo) }}
              style={styles.mediaImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  containerList: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  centeredEmpty: {
    padding: theme.spacing.lg,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: theme.colors.danger,
  },
  coverImage: {
    width: '100%',
    height: 220,
    backgroundColor: theme.colors.lightGray,
  },
  coverPlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: theme.colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: theme.colors.card,
    marginHorizontal: theme.spacing.md,
    marginTop: -24,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  scientificName: {
    fontSize: 15,
    fontStyle: 'italic',
    color: theme.colors.subtext,
    marginTop: theme.spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: theme.spacing.sm,
    gap: 8,
  },
  infoPill: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.xl,
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primaryDark,
  },
  observacoes: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: theme.spacing.sm,
    lineHeight: 20,
  },
  nextCareRow: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.soft,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  photoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  smallButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'flex-start',
  },
  smallButtonText: {
    color: theme.colors.card,
    fontWeight: 'bold',
    fontSize: 13,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  photoGridItem: {
    width: (SCREEN_WIDTH - theme.spacing.md * 2 - theme.spacing.md * 2 - 8) / 2,
    height: (SCREEN_WIDTH - theme.spacing.md * 2 - theme.spacing.md * 2 - 8) / 2,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: theme.colors.lightGray,
  },
  photoGridImage: {
    width: '100%',
    height: '100%',
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  emptyPhotoText: {
    color: theme.colors.subtext,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: theme.spacing.sm,
  },
  visaoImage: {
    width: '100%',
    height: 200,
    borderRadius: theme.borderRadius.sm,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.lightGray,
  },
  visaoDescricao: {
    fontSize: 14,
    color: theme.colors.subtext,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  // Modais
  mediaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
  },
  mediaImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
  mediaVideo: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * (9 / 16),
  },
  baseImagePickerContainer: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
  baseImagePickerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  baseImagePickerItem: {
    marginRight: theme.spacing.sm,
  },
  baseImagePickerPhoto: {
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.lightGray,
  },
  baseImagePickerCancel: {
    marginTop: theme.spacing.md,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  baseImagePickerCancelText: {
    color: theme.colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PlantDetailScreen;
