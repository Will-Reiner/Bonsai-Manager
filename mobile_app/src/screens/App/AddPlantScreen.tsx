import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { especieService } from '../../services/especieService';
import { plantaService, CreatePlantaDTO } from '../../services/plantaService';
import { fotoService } from '../../services/fotoService';
import { Especie, ModoAquisicao } from '../../types';
import { theme } from '../../constants/theme';
import { CoverPhotoPicker } from '../../components/CoverPhotoPicker';
import { usePreferencias } from '../../context/PreferenciasContext';

const AddPlantScreen = () => {
  const navigation = useNavigation();
  const { preferencias } = usePreferencias();

  // Estados do formulário alinhados com o novo DTO
  const [nome, setNome] = useState('');
  const [identificador, setIdentificador] = useState('');
  const [especieId, setEspecieId] = useState<string | undefined>();
  const [modoAquisicao, setModoAquisicao] = useState<ModoAquisicao | undefined>();
  const [observacoes, setObservacoes] = useState('');
  const [coverPublicUrl, setCoverPublicUrl] = useState<string | undefined>();
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  // Estados de controlo
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingEspecies, setIsFetchingEspecies] = useState(true);

  // Modal de sugestão
  const [showSugerirModal, setShowSugerirModal] = useState(false);
  const [nomeComumSugestao, setNomeComumSugestao] = useState('');
  const [isSugerindo, setIsSugerindo] = useState(false);

  const fetchEspecies = async () => {
    try {
      const data = await especieService.getAllEspecies();
      setEspecies(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar a lista de espécies.');
    } finally {
      setIsFetchingEspecies(false);
    }
  };

  useEffect(() => {
    fetchEspecies();
  }, []);

  const handleSugerirEspecie = async () => {
    if (!nomeComumSugestao.trim()) {
      Alert.alert('Erro', 'O nome comum é obrigatório.');
      return;
    }

    setIsSugerindo(true);
    try {
      const novaEspecie = await especieService.createEspecie({ nomeComum: nomeComumSugestao.trim() });
      setEspecies(prev => [...prev, novaEspecie]);
      setEspecieId(novaEspecie.id);
      setNomeComumSugestao('');
      setShowSugerirModal(false);
      Alert.alert('Sucesso', 'Espécie sugerida com sucesso! Ela será revisada pela administração.');
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível sugerir a espécie.');
    } finally {
      setIsSugerindo(false);
    }
  };

  const handleSubmit = async () => {
    if (!especieId) {
      Alert.alert('Campo Obrigatório', 'Por favor, selecione uma espécie.');
      return;
    }

    setIsLoading(true);
    const plantaData: CreatePlantaDTO = {
      especieId,
      nome: nome || undefined,
      identificador: identificador || undefined,
      modoAquisicao: modoAquisicao || undefined,
      observacoes: observacoes || undefined,
      fotoCapaUrl: coverPublicUrl || undefined,
    };

    try {
      const planta = await plantaService.createPlanta(plantaData);
      // Criar registo Foto para a galeria
      if (coverPublicUrl) {
        try {
          await fotoService.createFoto({
            caminhoArquivo: coverPublicUrl,
            plantaId: planta.id,
            titulo: 'Foto de capa',
            tipo: 'FOTO',
          });
        } catch {
          // Não bloquear a criação da planta se o registo da foto falhar
        }
      }
      Alert.alert('Sucesso', 'Planta adicionada à sua coleção!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a planta.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <CoverPhotoPicker
        onImageUploaded={(url) => { setCoverPublicUrl(url); setIsUploadingCover(false); }}
        onImageRemoved={() => { setCoverPublicUrl(undefined); setIsUploadingCover(false); }}
      />

      {preferencias.usa_nome_planta === 'true' && (
        <>
          <Text style={styles.label}>Nome (Apelido)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Meu Junípero"
            value={nome}
            onChangeText={setNome}
          />
        </>
      )}

      {preferencias.usa_identificador === 'true' && (
        <>
          <Text style={styles.label}>Identificador (Plaquinha)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 001, A-12..."
            value={identificador}
            onChangeText={setIdentificador}
          />
        </>
      )}

      <Text style={styles.label}>Espécie *</Text>
      <View style={styles.pickerContainer}>
        {isFetchingEspecies ? (
          <ActivityIndicator />
        ) : (
          <Picker
            selectedValue={especieId}
            onValueChange={(itemValue) => setEspecieId(itemValue)}
          >
            <Picker.Item label="Selecione uma espécie..." value={undefined} />
            {especies.map((especie) => (
              <Picker.Item
                key={especie.id}
                label={especie.nomeComum || especie.nomeCientifico || 'Sem nome'}
                value={especie.id}
              />
            ))}
          </Picker>
        )}
      </View>

      <TouchableOpacity
        style={styles.suggestButton}
        onPress={() => setShowSugerirModal(true)}
      >
        <Text style={styles.suggestButtonText}>Não encontrou? Sugerir Nova Espécie</Text>
      </TouchableOpacity>

      <Text style={styles.label}>Como foi Adquirido</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={modoAquisicao}
          onValueChange={(itemValue) => setModoAquisicao(itemValue)}
        >
          <Picker.Item label="Selecione o modo..." value={undefined} />
          <Picker.Item label="Semente" value="SEMENTE" />
          <Picker.Item label="Estaca" value="ESTACA" />
          <Picker.Item label="Alporquia" value="ALPORQUIA" />
          <Picker.Item label="Yamadori" value="YAMADORI" />
          <Picker.Item label="Compra" value="COMPRA" />
        </Picker>
      </View>

      <Text style={styles.label}>Observações Gerais</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Detalhes sobre a aquisição, estado inicial, etc."
        value={observacoes}
        onChangeText={setObservacoes}
        multiline
      />

      <TouchableOpacity
        style={[styles.button, (isLoading || isUploadingCover) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isLoading || isUploadingCover}
      >
        {isLoading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Adicionar Planta</Text>
        )}
      </TouchableOpacity>

      <Modal
        visible={showSugerirModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSugerirModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sugerir Nova Espécie</Text>
            <Text style={styles.modalSubtitle}>
              A espécie será enviada para aprovação pela administração.
            </Text>

            <Text style={styles.label}>Nome Comum *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Figueira, Junípero..."
              value={nomeComumSugestao}
              onChangeText={setNomeComumSugestao}
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowSugerirModal(false);
                  setNomeComumSugestao('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, isSugerindo && styles.buttonDisabled]}
                onPress={handleSugerirEspecie}
                disabled={isSugerindo}
              >
                {isSugerindo ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Sugerir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    contentContainer: {
        padding: theme.spacing.lg,
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    input: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        paddingHorizontal: theme.spacing.md,
        height: 50,
        fontSize: 16,
        marginBottom: theme.spacing.lg,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        color: theme.colors.text,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
        paddingTop: theme.spacing.md,
    },
    pickerContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        marginBottom: theme.spacing.sm,
        justifyContent: 'center',
    },
    button: {
        backgroundColor: theme.colors.success,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    buttonDisabled: {
        backgroundColor: theme.colors.lightGray,
    },
    buttonText: {
        color: theme.colors.card,
        fontSize: 18,
        fontWeight: 'bold',
    },
    suggestButton: {
        marginBottom: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        alignItems: 'center',
    },
    suggestButtonText: {
        color: theme.colors.primary,
        fontSize: 15,
        fontWeight: '600',
        textDecorationLine: 'underline',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
    },
    modalContent: {
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        padding: theme.spacing.lg,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    modalSubtitle: {
        fontSize: 14,
        color: theme.colors.subtext || theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: theme.colors.lightGray,
    },
    cancelButtonText: {
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    confirmButton: {
        backgroundColor: theme.colors.primary,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default AddPlantScreen;
