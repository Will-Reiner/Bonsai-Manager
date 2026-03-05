import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import api from '../../api';
import { theme } from '../../constants/theme';

const EditProfileScreen = () => {
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();

  const [nome, setNome] = useState(user?.nome || '');
  const [nomePublico, setNomePublico] = useState(user?.nomePublico || '');
  const [localidade, setLocalidade] = useState(user?.localidade || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!nome.trim()) {
      Alert.alert('Erro', 'O nome é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.put('/auth/me', {
        nome: nome.trim(),
        nomePublico: nomePublico.trim() || null,
        localidade: localidade.trim() || null,
        bio: bio.trim() || null,
      });

      await updateUser(response.data);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.field}>
        <Text style={styles.label}>Nome *</Text>
        <TextInput
          style={styles.input}
          value={nome}
          onChangeText={setNome}
          placeholder="O seu nome"
          placeholderTextColor={theme.colors.subtext}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Nome Público</Text>
        <TextInput
          style={styles.input}
          value={nomePublico}
          onChangeText={setNomePublico}
          placeholder="Nome visível para outros utilizadores"
          placeholderTextColor={theme.colors.subtext}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Localidade</Text>
        <TextInput
          style={styles.input}
          value={localidade}
          onChangeText={setLocalidade}
          placeholder="Cidade ou região"
          placeholderTextColor={theme.colors.subtext}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={bio}
          onChangeText={setBio}
          placeholder="Conte um pouco sobre si..."
          placeholderTextColor={theme.colors.subtext}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </View>

      <TouchableOpacity
        style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator color={theme.colors.card} />
        ) : (
          <Text style={styles.submitButtonText}>Guardar Alterações</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.medium,
  },
  field: {
    marginBottom: theme.spacing.medium,
  },
  label: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.small,
  },
  input: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 12,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: theme.spacing.medium,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: theme.colors.card,
    fontWeight: 'bold',
    fontSize: theme.typography.body.fontSize,
  },
});

export default EditProfileScreen;
