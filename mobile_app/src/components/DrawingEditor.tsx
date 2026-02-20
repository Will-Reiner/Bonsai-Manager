import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Alert,
} from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  Image as SkiaImage,
  useImage,
  useCanvasRef,
  SkPath,
} from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system/next';
import { theme } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CANVAS_WIDTH = SCREEN_WIDTH - 32;
const CANVAS_HEIGHT = SCREEN_HEIGHT * 0.55;

const COLORS = [
  { label: 'Verde', value: '#4A7C59' },
  { label: 'Marrom', value: '#8B6914' },
  { label: 'Preto', value: '#000000' },
  { label: 'Branco', value: '#FFFFFF' },
  { label: 'Vermelho', value: '#CC0000' },
];

const STROKE_WIDTHS = [
  { label: 'Fino', value: 2 },
  { label: 'Médio', value: 5 },
  { label: 'Grosso', value: 10 },
];

interface DrawingPath {
  path: SkPath;
  color: string;
  strokeWidth: number;
}

interface DrawingEditorProps {
  visible: boolean;
  imageUrl: string;
  onSave: (localImageUri: string, descricao: string) => void;
  onClose: () => void;
}

export const DrawingEditor: React.FC<DrawingEditorProps> = ({
  visible,
  imageUrl,
  onSave,
  onClose,
}) => {
  const canvasRef = useCanvasRef();
  const backgroundImage = useImage(imageUrl || undefined);

  const [paths, setPaths] = useState<DrawingPath[]>([]);
  const [currentPath, setCurrentPath] = useState<SkPath | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState(STROKE_WIDTHS[1].value);
  const [descricao, setDescricao] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleTouchStart = useCallback((x: number, y: number) => {
    const path = Skia.Path.Make();
    path.moveTo(x, y);
    setCurrentPath(path);
  }, []);

  const handleTouchMove = useCallback((x: number, y: number) => {
    setCurrentPath(prev => {
      if (!prev) return null;
      const updated = prev.copy();
      updated.lineTo(x, y);
      return updated;
    });
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (currentPath) {
      setPaths(prev => [...prev, {
        path: currentPath,
        color: selectedColor,
        strokeWidth: selectedStrokeWidth,
      }]);
      setCurrentPath(null);
    }
  }, [currentPath, selectedColor, selectedStrokeWidth]);

  const handleUndo = () => {
    setPaths(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPaths([]);
    setCurrentPath(null);
  };

  const handleSave = async () => {
    if (!canvasRef.current) {
      Alert.alert('Erro', 'Canvas não está pronto.');
      return;
    }

    setIsSaving(true);
    try {
      const snapshot = canvasRef.current.makeImageSnapshot();
      if (!snapshot) {
        Alert.alert('Erro', 'Não foi possível capturar o desenho.');
        setIsSaving(false);
        return;
      }

      const base64 = snapshot.encodeToBase64();
      if (!base64) {
        Alert.alert('Erro', 'Falha ao codificar imagem.');
        setIsSaving(false);
        return;
      }

      const fileName = `visao_futura_${Date.now()}.png`;
      const file = new File(Paths.cache, fileName);
      file.write(base64, { encoding: 'base64' });
      const filePath = file.uri;

      onSave(filePath, descricao);
      resetState();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('[DrawingEditor] Erro ao salvar:', err);
      Alert.alert('Erro', `Não foi possível salvar o esboço: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const resetState = () => {
    setPaths([]);
    setCurrentPath(null);
    setDescricao('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.headerButton}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Esboço de Visão</Text>
          <TouchableOpacity onPress={handleSave} disabled={isSaving}>
            <Text style={[styles.headerButton, styles.saveButton]}>
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View
          style={styles.canvasContainer}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderStart={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            handleTouchStart(locationX, locationY);
          }}
          onResponderMove={(e) => {
            const { locationX, locationY } = e.nativeEvent;
            handleTouchMove(locationX, locationY);
          }}
          onResponderRelease={() => handleTouchEnd()}
        >
          <Canvas ref={canvasRef} style={styles.canvas}>
            {backgroundImage && (
              <SkiaImage
                image={backgroundImage}
                x={0}
                y={0}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                fit="contain"
              />
            )}
            {paths.map((item, index) => (
              <Path
                key={index}
                path={item.path}
                color={item.color}
                style="stroke"
                strokeWidth={item.strokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
            ))}
            {currentPath && (
              <Path
                path={currentPath}
                color={selectedColor}
                style="stroke"
                strokeWidth={selectedStrokeWidth}
                strokeCap="round"
                strokeJoin="round"
              />
            )}
          </Canvas>
        </View>

        <View style={styles.toolbar}>
          <View style={styles.colorRow}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color.value}
                style={[
                  styles.colorButton,
                  { backgroundColor: color.value },
                  selectedColor === color.value && styles.colorButtonSelected,
                  color.value === '#FFFFFF' && styles.colorButtonWhite,
                ]}
                onPress={() => setSelectedColor(color.value)}
              />
            ))}
          </View>

          <View style={styles.strokeRow}>
            {STROKE_WIDTHS.map((sw) => (
              <TouchableOpacity
                key={sw.value}
                style={[
                  styles.strokeButton,
                  selectedStrokeWidth === sw.value && styles.strokeButtonSelected,
                ]}
                onPress={() => setSelectedStrokeWidth(sw.value)}
              >
                <Text style={[
                  styles.strokeButtonText,
                  selectedStrokeWidth === sw.value && styles.strokeButtonTextSelected,
                ]}>
                  {sw.label}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.undoButton} onPress={handleUndo} disabled={paths.length === 0}>
              <Text style={[styles.undoButtonText, paths.length === 0 && styles.disabledText]}>Desfazer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.undoButton} onPress={handleClear} disabled={paths.length === 0}>
              <Text style={[styles.undoButtonText, paths.length === 0 && styles.disabledText]}>Limpar</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TextInput
          style={styles.descricaoInput}
          placeholder="Descreva sua visão de futuro para este bonsai..."
          placeholderTextColor={theme.colors.subtext}
          value={descricao}
          onChangeText={setDescricao}
          multiline
          maxLength={500}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: 48,
    paddingBottom: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  headerButton: {
    fontSize: 16,
    color: theme.colors.danger,
  },
  saveButton: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  canvasContainer: {
    marginHorizontal: 16,
    marginTop: theme.spacing.sm,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  canvas: {
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  },
  toolbar: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: theme.spacing.sm,
  },
  colorButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: theme.colors.primary,
    borderWidth: 3,
  },
  colorButtonWhite: {
    borderColor: theme.colors.lightGray,
    borderWidth: 1,
  },
  strokeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  strokeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.lightGray,
  },
  strokeButtonSelected: {
    backgroundColor: theme.colors.primary,
  },
  strokeButtonText: {
    fontSize: 13,
    color: theme.colors.text,
  },
  strokeButtonTextSelected: {
    color: theme.colors.card,
    fontWeight: 'bold',
  },
  undoButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  undoButtonText: {
    fontSize: 13,
    color: theme.colors.danger,
    fontWeight: '600',
  },
  disabledText: {
    color: theme.colors.lightGray,
  },
  descricaoInput: {
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    padding: theme.spacing.md,
    fontSize: 15,
    color: theme.colors.text,
    minHeight: 60,
    textAlignVertical: 'top',
  },
});
