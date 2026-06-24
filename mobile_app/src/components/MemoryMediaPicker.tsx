import React, { useCallback, useRef, useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../constants/theme';
import { processAndUploadMedia } from '../utils/uploadMedia';
import { extractCaptureDate } from '../utils/mediaCapture';
import type { ReadyMedia } from '../screens/App/addPlant.helpers';

interface PendingMedia {
  localId: string;
  previewUri: string;
  tipo: 'FOTO' | 'VIDEO';
  status: 'uploading' | 'done' | 'error';
  progress: number;
  publicUrl?: string;
  thumbnailUrl?: string;
  dataCaptura: Date | null;
}

interface MemoryMediaPickerProps {
  onReadyItemsChange: (items: ReadyMedia[]) => void;
  onUploadingChange: (uploading: boolean) => void;
}

let idCounter = 0;
const nextId = () => `m-${Date.now()}-${idCounter++}`;
const formatDate = (d: Date | null) => (d ? d.toLocaleDateString('pt-BR') : 'Sem data');

export function MemoryMediaPicker({ onReadyItemsChange, onUploadingChange }: MemoryMediaPickerProps) {
  const [items, setItems] = useState<PendingMedia[]>([]);
  const [datePickerFor, setDatePickerFor] = useState<string | null>(null);
  const itemsRef = useRef<PendingMedia[]>([]);

  const sync = useCallback(
    (next: PendingMedia[]) => {
      itemsRef.current = next;
      setItems(next);
      onReadyItemsChange(
        next
          .filter((i) => i.status === 'done' && i.publicUrl)
          .map((i) => ({
            tipo: i.tipo,
            publicUrl: i.publicUrl!,
            thumbnailUrl: i.thumbnailUrl,
            dataCaptura: i.dataCaptura,
          })),
      );
      onUploadingChange(next.some((i) => i.status === 'uploading'));
    },
    [onReadyItemsChange, onUploadingChange],
  );

  const patch = useCallback(
    (localId: string, p: Partial<PendingMedia>) => {
      sync(itemsRef.current.map((i) => (i.localId === localId ? { ...i, ...p } : i)));
    },
    [sync],
  );

  const handleAdd = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permissão necessária', 'Precisamos de acesso à galeria para adicionar mídias.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsMultipleSelection: true,
      exif: true,
      quality: 1,
    });
    if (result.canceled) return;

    const newOnes: PendingMedia[] = result.assets.map((a) => ({
      localId: nextId(),
      previewUri: a.uri,
      tipo: a.type === 'video' || a.mimeType?.startsWith('video/') ? 'VIDEO' : 'FOTO',
      status: 'uploading',
      progress: 0,
      dataCaptura: null,
    }));
    sync([...itemsRef.current, ...newOnes]);

    for (let idx = 0; idx < result.assets.length; idx++) {
      const asset = result.assets[idx];
      const { localId, tipo } = newOnes[idx];
      const mimeType = asset.mimeType ?? (tipo === 'VIDEO' ? 'video/mp4' : 'image/jpeg');
      try {
        const date = await extractCaptureDate(asset);
        patch(localId, { dataCaptura: date });
        const processed = await processAndUploadMedia(asset.uri, mimeType, (pc) =>
          patch(localId, { progress: Math.round(pc) }),
        );
        if (!itemsRef.current.some((i) => i.localId === localId)) continue; // removido durante upload
        patch(localId, {
          status: 'done',
          publicUrl: processed.publicUrl,
          thumbnailUrl: processed.thumbnailUrl,
          progress: 100,
        });
      } catch {
        if (!itemsRef.current.some((i) => i.localId === localId)) continue;
        patch(localId, { status: 'error' });
      }
    }
  };

  const handleRemove = (localId: string) => {
    sync(itemsRef.current.filter((i) => i.localId !== localId));
  };

  const onDateChange = (localId: string, _event: unknown, selected?: Date) => {
    setDatePickerFor(null);
    if (selected) patch(localId, { dataCaptura: selected });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Fotos e Vídeos da Memória</Text>
      <Text style={styles.subtitle}>
        Registre outros períodos da planta. A data é detectada automaticamente e pode ser ajustada.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <View key={item.localId} style={styles.tile}>
            <Image source={{ uri: item.thumbnailUrl ?? item.previewUri }} style={styles.thumb} />

            {item.tipo === 'VIDEO' && (
              <View style={styles.playBadge}>
                <Ionicons name="play" size={12} color="#fff" />
              </View>
            )}

            {item.status === 'uploading' && (
              <View style={styles.overlay}>
                <Text style={styles.overlayText}>{item.progress}%</Text>
              </View>
            )}

            {item.status === 'error' && (
              <View style={[styles.overlay, styles.errorOverlay]}>
                <Ionicons name="alert-circle" size={20} color="#fff" />
                <Text style={styles.overlayText}>Erro</Text>
              </View>
            )}

            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.localId)}>
              <Ionicons name="close-circle" size={22} color={theme.colors.danger} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateChip}
              onPress={() => setDatePickerFor(item.localId)}
              disabled={item.status === 'uploading'}
            >
              <Ionicons name="calendar-outline" size={11} color="#fff" />
              <Text style={styles.dateChipText} numberOfLines={1}>
                {formatDate(item.dataCaptura)}
              </Text>
            </TouchableOpacity>

            {datePickerFor === item.localId && (
              <DateTimePicker
                value={item.dataCaptura ?? new Date()}
                mode="date"
                maximumDate={new Date()}
                onChange={(e, d) => onDateChange(item.localId, e, d)}
              />
            )}
          </View>
        ))}

        <TouchableOpacity style={styles.addTile} onPress={handleAdd}>
          <Ionicons name="add" size={32} color={theme.colors.primary} />
          <Text style={styles.addText}>Adicionar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const TILE = 120;

const styles = StyleSheet.create({
  container: { marginBottom: theme.spacing.lg },
  label: { fontSize: 16, fontWeight: 'bold', color: theme.colors.text, marginBottom: theme.spacing.xs },
  subtitle: { fontSize: 13, color: theme.colors.subtext, marginBottom: theme.spacing.sm },
  row: { gap: theme.spacing.sm, paddingVertical: theme.spacing.xs },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: theme.colors.lightGray,
  },
  thumb: { width: '100%', height: '100%' },
  playBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    padding: 3,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorOverlay: { backgroundColor: 'rgba(180,0,0,0.55)' },
  overlayText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 12,
  },
  dateChip: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  dateChipText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  addTile: {
    width: TILE,
    height: TILE,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.lightGray,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addText: { marginTop: 4, fontSize: 13, color: theme.colors.primary, fontWeight: '600' },
});
