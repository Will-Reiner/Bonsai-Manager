import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../api';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import type { KeyboardTypeOptions } from 'react-native';

const RegisterScreen = () => {
  const navigation = useNavigation();

  // Estados para o formulário
  const [nome, setNome] = useState('');
  const [nomePublico, setNomePublico] = useState('');
  const [localidade, setLocalidade] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha os campos obrigatórios (Nome, Email, Senha).');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/register', {
        nome,
        email,
        senha,
        nomePublico: nomePublico || undefined,
        localidade: localidade || undefined,
      });

      Alert.alert(
        'Sucesso!',
        'A sua conta foi criada. Agora pode fazer o login.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        Alert.alert('Erro de Registo', error.response.data.message);
      } else {
        Alert.alert('Erro de Registo', 'Não foi possível criar a conta. Tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  interface InputFieldProps {
    icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
    placeholder: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    keyboardType?: KeyboardTypeOptions;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  }

  const InputField: React.FC<InputFieldProps> = ({ icon, placeholder, value, onChangeText, secureTextEntry = false, keyboardType = 'default', autoCapitalize = 'sentences' }) => (
    <View style={styles.inputContainer}>
      <MaterialCommunityIcons name={icon} size={24} color={theme.colors.subtext} style={styles.icon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        placeholderTextColor={theme.colors.subtext}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Comece a gerir a sua coleção</Text>

        <InputField icon="account-circle-outline" placeholder="Nome Completo *" value={nome} onChangeText={setNome} />
        <InputField icon="account-outline" placeholder="Nome Público (Apelido)" value={nomePublico} onChangeText={setNomePublico} />
        <InputField icon="map-marker-outline" placeholder="Localidade (Ex: Brasília - DF)" value={localidade} onChangeText={setLocalidade} />
        <InputField icon="email-outline" placeholder="Email *" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        <InputField icon="lock-outline" placeholder="Senha (Mínimo 6 caracteres) *" value={senha} onChangeText={setSenha} secureTextEntry />
        <InputField icon="lock-check-outline" placeholder="Confirmar Senha *" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>Registar</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Já tenho uma conta. Voltar para o Login.</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.large,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.small,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.subtext,
    marginBottom: theme.spacing.large,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    width: '100%',
    height: 50,
    marginBottom: theme.spacing.medium,
    paddingHorizontal: theme.spacing.medium,
  },
  icon: {
    marginRight: theme.spacing.small,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: theme.colors.text,
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: theme.colors.success, // Cor atualizada para sucesso
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.small,
  },
  buttonDisabled: {
    backgroundColor: '#a3d9b1', // Tom mais claro do verde de sucesso
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
      marginTop: theme.spacing.large,
  },
  backButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
  }
});

export default RegisterScreen;