import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../constants/theme';
import { usePreferencias } from '../../context/PreferenciasContext';
import api from '../../api';
import { Atividade } from '../../types';

const FREQUENCIA_OPTIONS = [
  { valor: 'SEMANAL', label: 'Semanal' },
  { valor: 'QUINZENAL', label: 'Quinzenal' },
  { valor: 'MENSAL', label: 'Mensal' },
  { valor: 'OUTRO', label: 'Outra' },
];

const TRANSPLANTE_OPTIONS = [
  { valor: '0', label: 'Não espero' },
  { valor: '10', label: '10 dias' },
  { valor: '15', label: '15 dias' },
  { valor: '20', label: '20 dias' },
  { valor: '30', label: '1 mês' },
  { valor: '60', label: '2 meses' },
  { valor: '90', label: '3 meses' },
  { valor: '180', label: '6 meses' },
];

const PreferenciasScreen = () => {
  const navigation = useNavigation();
  const { preferencias, updatePreferencias } = usePreferencias();

  const [localPrefs, setLocalPrefs] = useState({ ...preferencias });
  const [atividades, setAtividades] = useState<Atividade[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAtividades, setIsLoadingAtividades] = useState(true);

  useEffect(() => {
    setLocalPrefs({ ...preferencias });
  }, [preferencias]);

  useEffect(() => {
    const fetchAtividades = async () => {
      try {
        const response = await api.get('/atividades');
        setAtividades(response.data);
      } catch {
        // silently handle
      } finally {
        setIsLoadingAtividades(false);
      }
    };
    fetchAtividades();
  }, []);

  const handleUpdate = (chave: string, valor: string) => {
    setLocalPrefs(prev => ({ ...prev, [chave]: valor }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferencias(localPrefs);
      Alert.alert('Sucesso', 'Preferências salvas com sucesso!');
      navigation.goBack();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as preferências.');
    } finally {
      setIsSaving(false);
    }
  };

  let selectedAtividades: string[] = [];
  try {
    selectedAtividades = JSON.parse(localPrefs.atividades_rastreadas || '[]');
  } catch {
    selectedAtividades = [];
  }

  const toggleAtividade = (id: string) => {
    const newIds = selectedAtividades.includes(id)
      ? selectedAtividades.filter(i => i !== id)
      : [...selectedAtividades, id];
    handleUpdate('atividades_rastreadas', JSON.stringify(newIds));
  };

  const adubacaoModo = localPrefs.adubacao_modo || 'GERAL';
  const mostraFrequencia = adubacaoModo !== 'NAO_ADUBA';

  const ChipOption = ({ selected, label, onPress }: { selected: boolean; label: string; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Identificação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identificação das Plantas</Text>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Usar plaquinhas/identificadores</Text>
              <Text style={styles.switchDescription}>Habilita campo de identificador numérico</Text>
            </View>
            <Switch
              value={localPrefs.usa_identificador === 'true'}
              onValueChange={(v) => handleUpdate('usa_identificador', v ? 'true' : 'false')}
              trackColor={{ false: theme.colors.lightGray, true: theme.colors.primaryLight }}
              thumbColor={localPrefs.usa_identificador === 'true' ? theme.colors.primary : '#f4f3f4'}
            />
          </View>

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Dar nomes às plantas</Text>
              <Text style={styles.switchDescription}>Mostra campo de apelido na criação</Text>
            </View>
            <Switch
              value={localPrefs.usa_nome_planta === 'true'}
              onValueChange={(v) => handleUpdate('usa_nome_planta', v ? 'true' : 'false')}
              trackColor={{ false: theme.colors.lightGray, true: theme.colors.primaryLight }}
              thumbColor={localPrefs.usa_nome_planta === 'true' ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Rega */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rega</Text>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Text style={styles.switchLabel}>Gerenciar rega pelo app</Text>
              <Text style={styles.switchDescription}>Cria lembretes automáticos de rega</Text>
            </View>
            <Switch
              value={localPrefs.gerencia_rega === 'true'}
              onValueChange={(v) => handleUpdate('gerencia_rega', v ? 'true' : 'false')}
              trackColor={{ false: theme.colors.lightGray, true: theme.colors.primaryLight }}
              thumbColor={localPrefs.gerencia_rega === 'true' ? theme.colors.primary : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Adubação */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Adubação</Text>

          <Text style={styles.fieldLabel}>Modo de adubação</Text>
          <View style={styles.chipRow}>
            <ChipOption selected={adubacaoModo === 'GERAL'} label="Geral" onPress={() => handleUpdate('adubacao_modo', 'GERAL')} />
            <ChipOption selected={adubacaoModo === 'INDIVIDUAL'} label="Individual" onPress={() => handleUpdate('adubacao_modo', 'INDIVIDUAL')} />
            <ChipOption selected={adubacaoModo === 'NAO_ADUBA'} label="Não adubo" onPress={() => handleUpdate('adubacao_modo', 'NAO_ADUBA')} />
          </View>

          {mostraFrequencia && (
            <>
              <Text style={styles.fieldLabel}>Frequência</Text>
              <View style={styles.chipRow}>
                {FREQUENCIA_OPTIONS.map(opt => (
                  <ChipOption
                    key={opt.valor}
                    selected={(localPrefs.adubacao_frequencia || 'MENSAL') === opt.valor}
                    label={opt.label}
                    onPress={() => handleUpdate('adubacao_frequencia', opt.valor)}
                  />
                ))}
              </View>
            </>
          )}

          <Text style={styles.fieldLabel}>Espera pós-transplante</Text>
          <View style={styles.chipRow}>
            {TRANSPLANTE_OPTIONS.map(opt => (
              <ChipOption
                key={opt.valor}
                selected={(localPrefs.periodo_pos_transplante_dias || '90') === opt.valor}
                label={opt.label}
                onPress={() => handleUpdate('periodo_pos_transplante_dias', opt.valor)}
              />
            ))}
          </View>
        </View>

        {/* Atividades */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Atividades Rastreadas</Text>
          {isLoadingAtividades ? (
            <ActivityIndicator color={theme.colors.primary} />
          ) : (
            <View style={styles.chipRow}>
              {atividades.map(a => (
                <ChipOption
                  key={a.id}
                  selected={selectedAtividades.includes(a.id)}
                  label={a.nome}
                  onPress={() => toggleAtividade(a.id)}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: theme.spacing.xl }} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.md,
  },
  section: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.soft,
  },
  sectionTitle: {
    ...theme.typography.subtitle,
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  switchInfo: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  switchLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
  },
  switchDescription: {
    ...theme.typography.caption,
    marginTop: 2,
  },
  fieldLabel: {
    ...theme.typography.body,
    color: theme.colors.text,
    fontWeight: '600',
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryLight,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: theme.colors.primaryDark,
    fontWeight: '600',
  },
  footer: {
    padding: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.lightGray,
    backgroundColor: theme.colors.card,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    borderRadius: theme.borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.lightGray,
  },
  saveButtonText: {
    ...theme.typography.button,
    color: '#fff',
  },
});

export default PreferenciasScreen;
