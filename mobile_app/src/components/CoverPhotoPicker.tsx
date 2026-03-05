import React, { useState, useEffect } from 'react';
import { View, Image, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useMediaUpload } from '../hooks/useMediaUpload';
import { UploadProgressBar } from './UploadProgressBar';
import { theme } from '../constants/theme';

interface CoverPhotoPickerProps {
  currentImageUrl?: string | null;
  onImageUploaded: (publicUrl: string) => void;
  onImageRemoved: () => void;
}

export function CoverPhotoPicker({ currentImageUrl, onImageUploaded, onImageRemoved }: CoverPhotoPickerProps) {
  const [coverUri, setCoverUri] = useState<string | null>(currentImageUrl || null);
  const { upload, isUploading, progress, phase, error, reset } = useMediaUpload();

  useEffect(() => {
    if (currentImageUrl) {
      setCoverUri(currentImageUrl);
    }
  }, [currentImageUrl]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para selecionar uma foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setCoverUri(asset.uri);

    try {
      const mimeType = asset.mimeType || 'image/jpeg';
      const uploadResult = await upload(asset.uri, mimeType);
      onImageUploaded(uploadResult.publicUrl);
    } catch {
      setCoverUri(currentImageUrl || null);
      Alert.alert('Erro', 'Não foi possível enviar a imagem. Tente novamente.');
    }
  };

  const handleRemove = () => {
    setCoverUri(null);
    reset();
    onImageRemoved();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Foto de Capa</Text>

      {coverUri ? (
        <View style={styles.previewContainer}>
          <Image source={{ uri: coverUri }} style={styles.preview} />
          {!isUploading && (
            <>
              <TouchableOpacity style={styles.removeButton} onPress={handleRemove}>
                <Ionicons name="close-circle" size={28} color={theme.colors.danger} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.changeButton} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={18} color="#fff" />
                <Text style={styles.changeButtonText}>Trocar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : (
        <TouchableOpacity style={styles.placeholder} onPress={handlePickImage} disabled={isUploading}>
          <Ionicons name="camera-outline" size={40} color={theme.colors.subtext} />
          <Text style={styles.placeholderText}>Selecionar Capa</Text>
        </TouchableOpacity>
      )}

      <UploadProgressBar progress={progress} phase={phase} visible={isUploading} />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  placeholder: {
    height: 180,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: theme.spacing.sm,
    fontSize: 15,
    color: theme.colors.subtext,
  },
  previewContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  preview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
  },
  changeButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 4,
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 13,
    marginTop: theme.spacing.xs,
  },
});
