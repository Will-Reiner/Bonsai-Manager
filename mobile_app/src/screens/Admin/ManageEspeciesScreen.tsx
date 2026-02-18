import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { especieService, CreateEspecieDTO } from '../../services/especieService';
import { Especie, TipoPlanta } from '../../types';
import { theme } from '../../constants/theme';

// O formulário agora é um componente separado e mais complexo
const AddEspecieForm = React.memo(({ onEspecieAdded }: { onEspecieAdded: () => void }) => {
  // Estados para todos os novos campos
  const [nomeCientifico, setNomeCientifico] = useState('');
  const [nomeComum, setNomeComum] = useState('');
  const [familia, setFamilia] = useState('');
  const [origem, setOrigem] = useState('');
  const [tipoDePlanta, setTipoDePlanta] = useState<TipoPlanta | undefined>();
  const [luminosidade, setLuminosidade] = useState('');
  const [rega, setRega] = useState('');
  const [substratoIdeal, setSubstratoIdeal] = useState('');
  const [adubacao, setAdubacao] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearForm = () => {
      setNomeCientifico('');
      setNomeComum('');
      setFamilia('');
      setOrigem('');
      setTipoDePlanta(undefined);
      setLuminosidade('');
      setRega('');
      setSubstratoIdeal('');
      setAdubacao('');
  };

  const handleAddEspecie = async () => {
    if (!nomeCientifico.trim() && !nomeComum.trim()) {
      Alert.alert('Erro', 'Preencha pelo menos o nome científico ou o nome comum.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateEspecieDTO = {
        nomeCientifico: nomeCientifico || undefined,
        nomeComum: nomeComum || undefined,
        familia: familia || undefined,
        origem: origem || undefined,
        tipoDePlanta: tipoDePlanta || undefined,
        luminosidade: luminosidade || undefined,
        rega: rega || undefined,
        substratoIdeal: substratoIdeal || undefined,
        adubacao: adubacao || undefined,
      };
      await especieService.createEspecie(data);
      Alert.alert('Sucesso', 'Nova espécie adicionada.');
      clearForm();
      onEspecieAdded();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a espécie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.formContainer}>
      <Text style={styles.formTitle}>Adicionar Nova Espécie</Text>

      <TextInput style={styles.input} placeholder="Nome Científico" value={nomeCientifico} onChangeText={setNomeCientifico} />
      <TextInput style={styles.input} placeholder="Nome Comum" value={nomeComum} onChangeText={setNomeComum} />
      <TextInput style={styles.input} placeholder="Família" value={familia} onChangeText={setFamilia} />
      <TextInput style={styles.input} placeholder="Origem" value={origem} onChangeText={setOrigem} />
      <View style={styles.pickerContainer}>
        <Picker selectedValue={tipoDePlanta} onValueChange={(itemValue) => setTipoDePlanta(itemValue)}>
            <Picker.Item label="Selecione um tipo de planta..." value={undefined} />
            <Picker.Item label="Perene" value="PERENE" />
            <Picker.Item label="Caducifólia (Decídua)" value="CADUCIFOLIA" />
            <Picker.Item label="Semi-Caduca" value="SEMI_CADUCA" />
            <Picker.Item label="Árvore" value="ARVORE" />
            <Picker.Item label="Arbusto" value="ARBUSTO" />
            <Picker.Item label="Conífera" value="CONIFERA" />
        </Picker>
      </View>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Luminosidade (Sol pleno, meia sombra...)" value={luminosidade} onChangeText={setLuminosidade} multiline/>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Rega (Frequência, volume...)" value={rega} onChangeText={setRega} multiline/>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Substrato Ideal" value={substratoIdeal} onChangeText={setSubstratoIdeal} multiline/>
      <TextInput style={[styles.input, styles.textArea]} placeholder="Adubação (Tipo, frequência...)" value={adubacao} onChangeText={setAdubacao} multiline/>

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleAddEspecie}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Adicionar Espécie</Text>}
      </TouchableOpacity>
    </View>
  );
});

const SugeridaItem = ({ especie, onAprovar }: { especie: Especie; onAprovar: (id: string) => void }) => {
  const [isApproving, setIsApproving] = useState(false);

  const handleAprovar = async () => {
    setIsApproving(true);
    try {
      await especieService.aprovarEspecie(especie.id);
      Alert.alert('Sucesso', `Espécie "${especie.nomeComum || especie.nomeCientifico}" aprovada.`);
      onAprovar(especie.id);
    } catch {
      Alert.alert('Erro', 'Não foi possível aprovar a espécie.');
    } finally {
      setIsApproving(false);
    }
  };

  return (
    <View style={styles.sugeridaItem}>
      <View style={styles.sugeridaInfo}>
        <Text style={styles.listItemTitle}>{especie.nomeComum || 'Sem nome comum'}</Text>
        {especie.nomeCientifico && <Text style={styles.listItemSubtitle}>{especie.nomeCientifico}</Text>}
      </View>
      <TouchableOpacity
        style={[styles.approveButton, isApproving && styles.buttonDisabled]}
        onPress={handleAprovar}
        disabled={isApproving}
      >
        {isApproving ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.approveButtonText}>Aprovar</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const ManageEspeciesScreen = () => {
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [sugeridas, setSugeridas] = useState<Especie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allData, sugeridasData] = await Promise.all([
        especieService.getAllEspecies(),
        especieService.getEspeciesSugeridas(),
      ]);
      setEspecies(allData);
      setSugeridas(sugeridasData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as espécies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  const handleAprovada = (id: string) => {
    setSugeridas(prev => prev.filter(e => e.id !== id));
    fetchData();
  };

  return (
    <FlatList
      style={styles.container}
      data={especies}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <View style={styles.listItemRow}>
            <Text style={styles.listItemTitle}>{item.nomeComum || item.nomeCientifico || 'Sem nome'}</Text>
            {item.status === 'SUGERIDO' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Sugerido</Text>
              </View>
            )}
          </View>
          {item.nomeCientifico && <Text style={styles.listItemSubtitle}>{item.nomeCientifico}</Text>}
        </View>
      )}
      ListHeaderComponent={
        <>
          <AddEspecieForm onEspecieAdded={fetchData} />

          {sugeridas.length > 0 && (
            <>
              <Text style={styles.listHeader}>Fila de Homologação ({sugeridas.length})</Text>
              {sugeridas.map(especie => (
                <SugeridaItem key={especie.id} especie={especie} onAprovar={handleAprovada} />
              ))}
            </>
          )}

          <Text style={styles.listHeader}>Espécies Existentes</Text>
        </>
      }
      ListEmptyComponent={!isLoading ? <Text style={styles.emptyText}>Nenhuma espécie cadastrada.</Text> : null}
      keyboardShouldPersistTaps="handled"
    />
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    formContainer: {
        padding: theme.spacing.md,
        backgroundColor: theme.colors.card,
    },
    formTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: theme.spacing.md,
        color: theme.colors.text,
    },
    input: {
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        borderRadius: 8,
        padding: theme.spacing.sm,
        marginBottom: theme.spacing.md,
        backgroundColor: theme.colors.card,
        fontSize: 16,
        color: theme.colors.text,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        marginBottom: theme.spacing.md,
        justifyContent: 'center',
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonDisabled: {
        backgroundColor: theme.colors.lightGray,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listHeader: {
        fontSize: 18,
        fontWeight: 'bold',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.background,
        borderTopWidth: 1,
        borderTopColor: theme.colors.lightGray,
        color: theme.colors.text,
    },
    listItem: {
        backgroundColor: theme.colors.card,
        padding: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.lightGray,
    },
    listItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    listItemTitle: {
        fontSize: 16,
        fontWeight: '500',
        color: theme.colors.text,
    },
    listItemSubtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    emptyText: {
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    badge: {
      backgroundColor: '#F59E0B',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
    },
    badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: 'bold',
    },
    sugeridaItem: {
      backgroundColor: theme.colors.card,
      padding: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sugeridaInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    approveButton: {
      backgroundColor: theme.colors.success || '#22C55E',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
    },
    approveButtonText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 14,
    },
});

export default ManageEspeciesScreen;
