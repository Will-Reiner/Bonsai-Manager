import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { especieService, CreateEspecieDTO } from '../../services/especieService';
import { Especie, TipoPlanta, StatusEspecie } from '../../types';
import { theme } from '../../constants/theme';
import { LabeledInput, FieldLabel, FormSectionTitle } from '../../components/FormField';

/**
 * Formulário reutilizável de espécie. Quando `initial` é fornecido funciona em
 * modo de edição (botões "Salvar" e "Excluir"); caso contrário, modo de criação.
 * `onDone` é chamado após uma operação bem-sucedida (para recarregar/fechar).
 */
const NAO_ESVAZIAR = 'Já tinha conteúdo — não pode ficar vazio.';

const EspecieForm = ({ initial, onDone }: { initial?: Especie; onDone: () => void }) => {
  const isEdit = !!initial;

  // No modo edição, um campo que já tinha conteúdo não pode ser esvaziado
  // (o backend ignora campos vazios, então o valor antigo permaneceria).
  const avisoEsvaziado = (valor: string, valorInicial?: string | null) =>
    isEdit && !!(valorInicial ?? '').trim() && !valor.trim() ? NAO_ESVAZIAR : undefined;

  // Identificação
  const [nomeCientifico, setNomeCientifico] = useState(initial?.nomeCientifico ?? '');
  const [nomeComum, setNomeComum] = useState(initial?.nomeComum ?? '');
  const [familia, setFamilia] = useState(initial?.familia ?? '');
  const [origem, setOrigem] = useState(initial?.origem ?? '');
  const [tipoDePlanta, setTipoDePlanta] = useState<TipoPlanta | undefined>(initial?.tipoDePlanta ?? undefined);
  const [status, setStatus] = useState<StatusEspecie>(initial?.status ?? 'VERIFICADO');
  // Características botânicas
  const [folhas, setFolhas] = useState(initial?.folhas ?? '');
  const [tronco, setTronco] = useState(initial?.tronco ?? '');
  const [flores, setFlores] = useState(initial?.flores ?? '');
  const [frutos, setFrutos] = useState(initial?.frutos ?? '');
  const [raizes, setRaizes] = useState(initial?.raizes ?? '');
  // Cuidados
  const [luminosidade, setLuminosidade] = useState(initial?.luminosidade ?? '');
  const [rega, setRega] = useState(initial?.rega ?? '');
  const [substratoIdeal, setSubstratoIdeal] = useState(initial?.substratoIdeal ?? '');
  const [adubacao, setAdubacao] = useState(initial?.adubacao ?? '');
  const [clima, setClima] = useState(initial?.clima ?? '');
  // Cultivo & avaliação
  const [problemasComuns, setProblemasComuns] = useState(initial?.problemasComuns ?? '');
  const [pros, setPros] = useState(initial?.pros ?? '');
  const [contras, setContras] = useState(initial?.contras ?? '');
  const [linhasDeRaciocinio, setLinhasDeRaciocinio] = useState(initial?.linhasDeRaciocinio ?? '');
  const [observacoes, setObservacoes] = useState(initial?.observacoes ?? '');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearForm = () => {
    setNomeCientifico('');
    setNomeComum('');
    setFamilia('');
    setOrigem('');
    setTipoDePlanta(undefined);
    setStatus('VERIFICADO');
    setFolhas('');
    setTronco('');
    setFlores('');
    setFrutos('');
    setRaizes('');
    setLuminosidade('');
    setRega('');
    setSubstratoIdeal('');
    setAdubacao('');
    setClima('');
    setProblemasComuns('');
    setPros('');
    setContras('');
    setLinhasDeRaciocinio('');
    setObservacoes('');
  };

  const buildData = (): CreateEspecieDTO => ({
    nomeCientifico: nomeCientifico.trim() || undefined,
    nomeComum: nomeComum.trim() || undefined,
    familia: familia.trim() || undefined,
    origem: origem.trim() || undefined,
    tipoDePlanta: tipoDePlanta || undefined,
    status,
    folhas: folhas.trim() || undefined,
    tronco: tronco.trim() || undefined,
    flores: flores.trim() || undefined,
    frutos: frutos.trim() || undefined,
    raizes: raizes.trim() || undefined,
    luminosidade: luminosidade.trim() || undefined,
    rega: rega.trim() || undefined,
    substratoIdeal: substratoIdeal.trim() || undefined,
    adubacao: adubacao.trim() || undefined,
    clima: clima.trim() || undefined,
    problemasComuns: problemasComuns.trim() || undefined,
    pros: pros.trim() || undefined,
    contras: contras.trim() || undefined,
    linhasDeRaciocinio: linhasDeRaciocinio.trim() || undefined,
    observacoes: observacoes.trim() || undefined,
  });

  const handleSubmit = async () => {
    if (!nomeCientifico.trim() && !nomeComum.trim()) {
      Alert.alert('Erro', 'Preencha pelo menos o nome científico ou o nome comum.');
      return;
    }

    // Bloqueio: campos que já tinham conteúdo não podem ser salvos vazios
    if (isEdit) {
      const campos: [string, string, string | null | undefined][] = [
        ['Nome Científico', nomeCientifico, initial?.nomeCientifico],
        ['Nome Comum', nomeComum, initial?.nomeComum],
        ['Família', familia, initial?.familia],
        ['Origem', origem, initial?.origem],
        ['Folhas', folhas, initial?.folhas],
        ['Tronco', tronco, initial?.tronco],
        ['Flores', flores, initial?.flores],
        ['Frutos', frutos, initial?.frutos],
        ['Raízes', raizes, initial?.raizes],
        ['Luminosidade', luminosidade, initial?.luminosidade],
        ['Rega', rega, initial?.rega],
        ['Substrato Ideal', substratoIdeal, initial?.substratoIdeal],
        ['Adubação', adubacao, initial?.adubacao],
        ['Clima', clima, initial?.clima],
        ['Problemas Comuns', problemasComuns, initial?.problemasComuns],
        ['Prós', pros, initial?.pros],
        ['Contras', contras, initial?.contras],
        ['Linhas de Raciocínio', linhasDeRaciocinio, initial?.linhasDeRaciocinio],
        ['Observações', observacoes, initial?.observacoes],
      ];
      const esvaziados = campos
        .filter(([, valor, valorInicial]) => !!(valorInicial ?? '').trim() && !valor.trim())
        .map(([label]) => label);
      if (esvaziados.length > 0) {
        Alert.alert(
          'Não é possível salvar',
          `Os campos a seguir já tinham conteúdo e não podem ficar vazios:\n\n• ${esvaziados.join('\n• ')}\n\nPreencha-os novamente para salvar.`
        );
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const data = buildData();
      if (isEdit && initial) {
        await especieService.updateEspecie(initial.id, data);
        Alert.alert('Sucesso', 'Espécie atualizada.');
      } else {
        await especieService.createEspecie(data);
        Alert.alert('Sucesso', 'Nova espécie adicionada.');
        clearForm();
      }
      onDone();
    } catch (error) {
      Alert.alert('Erro', isEdit ? 'Não foi possível atualizar a espécie.' : 'Não foi possível adicionar a espécie.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!initial) return;
    Alert.alert(
      'Excluir espécie',
      `Tem certeza que deseja excluir "${initial.nomeComum || initial.nomeCientifico || 'esta espécie'}"? Esta ação não pode ser desfeita.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await especieService.deleteEspecie(initial.id);
              Alert.alert('Sucesso', 'Espécie excluída.');
              onDone();
            } catch (error) {
              Alert.alert('Erro', 'Não foi possível excluir. Verifique se não há plantas usando esta espécie.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={isEdit ? undefined : styles.formContainer}>
      {!isEdit && <Text style={styles.formTitle}>Adicionar Nova Espécie</Text>}

      <FormSectionTitle>Identificação</FormSectionTitle>
      <LabeledInput label="Nome Científico" placeholder="Ex: Juniperus chinensis" value={nomeCientifico} onChangeText={setNomeCientifico} warning={avisoEsvaziado(nomeCientifico, initial?.nomeCientifico)} />
      <LabeledInput label="Nome Comum" placeholder="Ex: Junípero" value={nomeComum} onChangeText={setNomeComum} warning={avisoEsvaziado(nomeComum, initial?.nomeComum)} />
      <LabeledInput label="Família" placeholder="Ex: Cupressaceae" value={familia} onChangeText={setFamilia} warning={avisoEsvaziado(familia, initial?.familia)} />
      <LabeledInput label="Origem" placeholder="Ex: Ásia Oriental" value={origem} onChangeText={setOrigem} warning={avisoEsvaziado(origem, initial?.origem)} />
      <View style={styles.field}>
        <FieldLabel label="Tipo de Planta" />
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
      </View>
      <View style={styles.field}>
        <FieldLabel label="Status" />
        <View style={styles.pickerContainer}>
          <Picker selectedValue={status} onValueChange={(itemValue) => setStatus(itemValue)}>
              <Picker.Item label="Verificado" value="VERIFICADO" />
              <Picker.Item label="Sugerido (fila de homologação)" value="SUGERIDO" />
          </Picker>
        </View>
      </View>

      <FormSectionTitle>Características Botânicas</FormSectionTitle>
      <LabeledInput label="Folhas" placeholder="Forma, cor, tamanho..." value={folhas} onChangeText={setFolhas} multiline warning={avisoEsvaziado(folhas, initial?.folhas)} />
      <LabeledInput label="Tronco" placeholder="Casca, ramificação..." value={tronco} onChangeText={setTronco} multiline warning={avisoEsvaziado(tronco, initial?.tronco)} />
      <LabeledInput label="Flores" placeholder="Época, cor, aroma..." value={flores} onChangeText={setFlores} multiline warning={avisoEsvaziado(flores, initial?.flores)} />
      <LabeledInput label="Frutos" placeholder="Tipo, época..." value={frutos} onChangeText={setFrutos} multiline warning={avisoEsvaziado(frutos, initial?.frutos)} />
      <LabeledInput label="Raízes" placeholder="Características do sistema radicular..." value={raizes} onChangeText={setRaizes} multiline warning={avisoEsvaziado(raizes, initial?.raizes)} />

      <FormSectionTitle>Cuidados</FormSectionTitle>
      <LabeledInput label="Luminosidade" placeholder="Sol pleno, meia sombra..." value={luminosidade} onChangeText={setLuminosidade} multiline warning={avisoEsvaziado(luminosidade, initial?.luminosidade)} />
      <LabeledInput label="Rega" placeholder="Frequência, volume..." value={rega} onChangeText={setRega} multiline warning={avisoEsvaziado(rega, initial?.rega)} />
      <LabeledInput label="Substrato Ideal" placeholder="Composição do substrato..." value={substratoIdeal} onChangeText={setSubstratoIdeal} multiline warning={avisoEsvaziado(substratoIdeal, initial?.substratoIdeal)} />
      <LabeledInput label="Adubação" placeholder="Tipo, frequência..." value={adubacao} onChangeText={setAdubacao} multiline warning={avisoEsvaziado(adubacao, initial?.adubacao)} />
      <LabeledInput label="Clima" placeholder="Temperatura, umidade, resistência ao frio..." value={clima} onChangeText={setClima} multiline warning={avisoEsvaziado(clima, initial?.clima)} />

      <FormSectionTitle>Cultivo & Avaliação</FormSectionTitle>
      <LabeledInput label="Problemas Comuns" placeholder="Pragas, doenças, dificuldades..." value={problemasComuns} onChangeText={setProblemasComuns} multiline warning={avisoEsvaziado(problemasComuns, initial?.problemasComuns)} />
      <LabeledInput label="Prós" placeholder="Vantagens para bonsai..." value={pros} onChangeText={setPros} multiline warning={avisoEsvaziado(pros, initial?.pros)} />
      <LabeledInput label="Contras" placeholder="Desvantagens, limitações..." value={contras} onChangeText={setContras} multiline warning={avisoEsvaziado(contras, initial?.contras)} />
      <LabeledInput label="Linhas de Raciocínio" placeholder="Estilos e abordagens recomendadas..." value={linhasDeRaciocinio} onChangeText={setLinhasDeRaciocinio} multiline warning={avisoEsvaziado(linhasDeRaciocinio, initial?.linhasDeRaciocinio)} />
      <LabeledInput label="Observações" placeholder="Notas adicionais..." value={observacoes} onChangeText={setObservacoes} multiline warning={avisoEsvaziado(observacoes, initial?.observacoes)} />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{isEdit ? 'Salvar Alterações' : 'Adicionar Espécie'}</Text>}
      </TouchableOpacity>

      {isEdit && (
        <TouchableOpacity
          style={[styles.deleteButton, isSubmitting && styles.buttonDisabled]}
          onPress={handleDelete}
          disabled={isSubmitting}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Excluir Espécie</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

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
  const [editing, setEditing] = useState<Especie | null>(null);

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

  const onEditDone = () => {
    setEditing(null);
    fetchData();
  };

  return (
    <>
      <FlatList
        style={styles.container}
        data={especies}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem} onPress={() => setEditing(item)} activeOpacity={0.6}>
            <View style={styles.listItemRow}>
              <Text style={styles.listItemTitle}>{item.nomeComum || item.nomeCientifico || 'Sem nome'}</Text>
              {item.status === 'SUGERIDO' && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Sugerido</Text>
                </View>
              )}
              <View style={{ flex: 1 }} />
              <MaterialCommunityIcons name="pencil-outline" size={18} color={theme.colors.subtext} />
            </View>
            {item.nomeCientifico && <Text style={styles.listItemSubtitle}>{item.nomeCientifico}</Text>}
          </TouchableOpacity>
        )}
        ListHeaderComponent={
          <>
            <EspecieForm onDone={fetchData} />

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

      <Modal visible={!!editing} animationType="slide" transparent onRequestClose={() => setEditing(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar Espécie</Text>
              <TouchableOpacity onPress={() => setEditing(null)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <MaterialCommunityIcons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll} keyboardShouldPersistTaps="handled">
              {editing && <EspecieForm key={editing.id} initial={editing} onDone={onEditDone} />}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
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
    field: {
        marginBottom: theme.spacing.md,
    },
    pickerContainer: {
        backgroundColor: theme.colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: theme.colors.lightGray,
        justifyContent: 'center',
    },
    button: {
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: theme.colors.danger,
        padding: theme.spacing.md,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
        marginTop: theme.spacing.sm,
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
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '90%',
      paddingTop: theme.spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.lightGray,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    modalScroll: {
      padding: theme.spacing.md,
    },
});

export default ManageEspeciesScreen;
