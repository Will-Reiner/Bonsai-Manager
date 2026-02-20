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
import { SERVER_URL } from '../../api';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { UploadProgressBar } from '../../components/UploadProgressBar';
import { DrawingEditor } from '../../components/DrawingEditor';

type PlantDetailScreenRouteProp = RouteProp<RootStackParamList, 'PlantDetail'>;
type PlantDetailNavigationProp = NativeStackNavigationProp<RootStackParamList, 'PlantDetail'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Componente separado para o player de vídeo — mantém o hook useVideoPlayer sem ser condicional
const VideoPlayerView = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, p => {
    p.play();
  });
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

  const historico = useMemo(() => {
    return agenda.filter(item => item.status === 'CONCLUIDO')
                 .sort((a, b) => new Date(b.dataConcluida!).getTime() - new Date(a.dataConcluida!).getTime());
  }, [agenda]);

  // Separar fotos de visão futura das fotos regulares
  const visaoFutura = useMemo(() => {
    const visoes = fotos.filter(f => f.tipo === 'VISAO_FUTURA');
    return visoes.length > 0 ? visoes[0] : null; // Mais recente (já vem desc por createdAt)
  }, [fotos]);

  const fotosGaleria = useMemo(() => {
    return fotos.filter(f => f.tipo !== 'VISAO_FUTURA');
  }, [fotos]);

  const openDrawingEditor = () => {
    const fotosDisponiveis = fotos.filter(f => f.tipo === 'FOTO');
    if (fotosDisponiveis.length === 0) {
      Alert.alert('Sem fotos', 'Adicione pelo menos uma foto à planta para criar um esboço de visão.');
      return;
    }
    if (fotosDisponiveis.length === 1) {
      setDrawingBaseImage(resolveFotoUri(fotosDisponiveis[0].caminhoArquivo));
      setShowDrawingEditor(true);
    } else {
      setShowBaseImagePicker(true);
    }
  };

  const handleSelectBaseImage = (foto: Foto) => {
    setDrawingBaseImage(resolveFotoUri(foto.caminhoArquivo));
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

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 1,
    });

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

  // Resolve URI da foto: URLs R2 são absolutas; antigas são relativas ao servidor
  const resolveFotoUri = (caminhoArquivo: string) => {
    if (caminhoArquivo.startsWith('http')) return caminhoArquivo;
    return `${SERVER_URL}${caminhoArquivo}`;
  };

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
        <View style={styles.photoHeaderRow}>
          <Text style={styles.cardTitle}>Visão de Futuro</Text>
          <TouchableOpacity style={styles.addPhotoButton} onPress={openDrawingEditor}>
            <Text style={styles.addPhotoButtonText}>+ Criar Esboço</Text>
          </TouchableOpacity>
        </View>
        {visaoFutura ? (
          <View>
            <Image source={{ uri: resolveFotoUri(visaoFutura.caminhoArquivo) }} style={styles.visaoImage} />
            {visaoFutura.descricao ? <Text style={styles.visaoDescricao}>{visaoFutura.descricao}</Text> : null}
          </View>
        ) : (
          <Text style={styles.emptyPhotoText}>Nenhum esboço de visão criado.</Text>
        )}
        {renderDetailRow('Observações', planta.observacoes)}
      </View>
      <View style={styles.card}>
        <View style={styles.photoHeaderRow}>
          <Text style={styles.cardTitle}>Fotos & Vídeos</Text>
          <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddPhoto} disabled={isUploading}>
            {isUploading ? (
              <ActivityIndicator size="small" color={theme.colors.card} />
            ) : (
              <Text style={styles.addPhotoButtonText}>+ Adicionar</Text>
            )}
          </TouchableOpacity>
        </View>

        <UploadProgressBar progress={progress} phase={phase} visible={isUploading} />

        {fotosGaleria.length > 0 ? (
          <HScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photoScroll}>
            {fotosGaleria.map((foto) => (
              <TouchableOpacity
                key={foto.id}
                onPress={() => setSelectedMedia(foto)}
                onLongPress={() => handleDeletePhoto(foto.id)}
                style={styles.photoItem}
              >
                {foto.tipo === 'VIDEO' ? (
                  <View style={styles.videoThumbContainer}>
                    <Image
                      source={{ uri: foto.thumbnailUrl || resolveFotoUri(foto.caminhoArquivo) }}
                      style={styles.photoImage}
                    />
                    <View style={styles.playIconOverlay}>
                      <Ionicons name="play-circle" size={36} color="white" />
                    </View>
                  </View>
                ) : (
                  <Image
                    source={{ uri: resolveFotoUri(foto.caminhoArquivo) }}
                    style={styles.photoImage}
                  />
                )}
                {foto.titulo ? <Text style={styles.photoTitle} numberOfLines={1}>{foto.titulo}</Text> : null}
              </TouchableOpacity>
            ))}
          </HScrollView>
        ) : (
          <Text style={styles.emptyPhotoText}>Nenhuma mídia adicionada.</Text>
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
    <>
      <FlatList
          style={styles.container}
          data={historico}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <HistoryListItem item={item} />}
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

      {/* Seletor de foto base para o editor de desenho */}
      <Modal
        visible={showBaseImagePicker}
        transparent
        animationType="fade"
        onRequestClose={() => setShowBaseImagePicker(false)}
      >
        <View style={styles.mediaOverlay}>
          <View style={styles.baseImagePickerContainer}>
            <Text style={styles.baseImagePickerTitle}>Escolha uma foto como base</Text>
            <HScrollView horizontal showsHorizontalScrollIndicator={false}>
              {fotos.filter(f => f.tipo === 'FOTO').map((foto) => (
                <TouchableOpacity
                  key={foto.id}
                  style={styles.baseImagePickerItem}
                  onPress={() => handleSelectBaseImage(foto)}
                >
                  <Image
                    source={{ uri: resolveFotoUri(foto.caminhoArquivo) }}
                    style={styles.baseImagePickerPhoto}
                  />
                </TouchableOpacity>
              ))}
            </HScrollView>
            <TouchableOpacity
              style={styles.baseImagePickerCancel}
              onPress={() => setShowBaseImagePicker(false)}
            >
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
      <Modal
        visible={!!selectedMedia}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
        statusBarTranslucent
      >
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
        <View style={styles.mediaOverlay}>
          <TouchableOpacity style={styles.mediaCloseBtn} onPress={() => setSelectedMedia(null)}>
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>

          {selectedMedia?.tipo === 'VIDEO' ? (
            <VideoPlayerView uri={selectedMedia.caminhoArquivo} />
          ) : selectedMedia ? (
            <Image
              source={{ uri: resolveFotoUri(selectedMedia.caminhoArquivo) }}
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
    videoThumbContainer: {
        position: 'relative',
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
        borderRadius: 8,
    },
    // Estilos do viewer em tela cheia
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
    visaoImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginTop: theme.spacing.sm,
        backgroundColor: theme.colors.lightGray,
    },
    visaoDescricao: {
        fontSize: 14,
        color: theme.colors.subtext,
        marginTop: theme.spacing.sm,
        fontStyle: 'italic',
    },
    baseImagePickerContainer: {
        backgroundColor: theme.colors.card,
        margin: theme.spacing.lg,
        borderRadius: 12,
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
        borderRadius: 8,
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
