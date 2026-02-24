import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { VideoView, useVideoPlayer } from 'expo-video';
import { fotoService } from '../../services/fotoService';
import { Foto } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';
import { resolveMediaUri } from '../../utils/resolveMediaUri';
import { useMediaUpload } from '../../hooks/useMediaUpload';
import { UploadProgressBar } from '../../components/UploadProgressBar';

type PhotoGalleryRouteProp = RouteProp<RootStackParamList, 'PhotoGallery'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - theme.spacing.md * 3) / 2;

const VideoPlayerView = ({ uri }: { uri: string }) => {
  const player = useVideoPlayer(uri, p => { p.play(); });
  return (
    <VideoView
      player={player}
      style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * (9 / 16) }}
      nativeControls
      allowsFullscreen
      allowsPictureInPicture
    />
  );
};

const PhotoGalleryScreen = () => {
  const route = useRoute<PhotoGalleryRouteProp>();
  const { plantaId } = route.params;

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<Foto | null>(null);
  const { upload, isUploading, progress, phase, reset: resetUpload } = useMediaUpload();

  const carregarFotos = useCallback(async () => {
    try {
      const data = await fotoService.getFotosPorPlanta(plantaId);
      setFotos(data.filter(f => f.tipo !== 'VISAO_FUTURA'));
    } catch {
      // silenciar
    }
  }, [plantaId]);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      carregarFotos().finally(() => setIsLoading(false));
    }, [carregarFotos])
  );

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

  const renderItem = ({ item }: { item: Foto }) => (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={() => setSelectedMedia(item)}
      onLongPress={() => handleDeletePhoto(item.id)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.tipo === 'VIDEO' && item.thumbnailUrl ? item.thumbnailUrl : resolveMediaUri(item.caminhoArquivo) }}
        style={styles.gridImage}
      />
      {item.tipo === 'VIDEO' && (
        <View style={styles.playOverlay}>
          <Ionicons name="play-circle" size={32} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <UploadProgressBar progress={progress} phase={phase} visible={isUploading} />

      <FlatList
        data={fotos}
        keyExtractor={item => item.id}
        numColumns={2}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={
          <View style={styles.centered}>
            <Text style={styles.emptyText}>Nenhuma mídia adicionada.</Text>
          </View>
        }
        ListHeaderComponent={
          <TouchableOpacity style={styles.addButton} onPress={handleAddPhoto} disabled={isUploading}>
            <Text style={styles.addButtonText}>+ Adicionar Mídia</Text>
          </TouchableOpacity>
        }
      />

      {/* Viewer em tela cheia */}
      <Modal visible={!!selectedMedia} transparent animationType="fade" onRequestClose={() => setSelectedMedia(null)} statusBarTranslucent>
        <StatusBar backgroundColor="rgba(0,0,0,0.95)" barStyle="light-content" />
        <View style={styles.mediaOverlay}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedMedia(null)}>
            <Ionicons name="close-circle" size={36} color="white" />
          </TouchableOpacity>
          {selectedMedia?.tipo === 'VIDEO' ? (
            <VideoPlayerView uri={resolveMediaUri(selectedMedia.caminhoArquivo)} />
          ) : selectedMedia ? (
            <Image
              source={{ uri: resolveMediaUri(selectedMedia.caminhoArquivo) }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  grid: {
    padding: theme.spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.lightGray,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.subtext,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  addButtonText: {
    color: theme.colors.card,
    fontWeight: 'bold',
    fontSize: 15,
  },
  mediaOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 10,
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.85,
  },
});

export default PhotoGalleryScreen;
