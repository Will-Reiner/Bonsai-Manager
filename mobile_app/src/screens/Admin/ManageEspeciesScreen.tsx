import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
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
    if (!nomeCientifico.trim()) {
      Alert.alert('Erro', 'O nome científico é obrigatório.');
      return;
    }
    setIsSubmitting(true);
    try {
      const data: CreateEspecieDTO = {
        nomeCientifico,
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
      
      <TextInput style={styles.input} placeholder="Nome Científico *" value={nomeCientifico} onChangeText={setNomeCientifico} />
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


const ManageEspeciesScreen = () => {
  const [especies, setEspecies] = useState<Especie[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEspecies = useCallback(async () => {
    setIsLoading(true); // Força o loading para dar feedback ao admin
    try {
      const data = await especieService.getAllEspecies();
      setEspecies(data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as espécies.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchEspecies();
    }, [fetchEspecies])
  );

  return (
    <FlatList
      style={styles.container}
      data={especies}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <View style={styles.listItem}>
          <Text style={styles.listItemTitle}>{item.nomeComum || item.nomeCientifico}</Text>
          <Text style={styles.listItemSubtitle}>{item.nomeCientifico}</Text>
        </View>
      )}
      ListHeaderComponent={
        <>
          <AddEspecieForm onEspecieAdded={fetchEspecies} />
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
    }
});

export default ManageEspeciesScreen;