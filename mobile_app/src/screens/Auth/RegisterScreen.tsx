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

const RegisterScreen = () => {
  const navigation = useNavigation();

  // Estados para o formulário, incluindo os novos campos
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
      // Enviamos os novos campos na chamada da API
      await api.post('/auth/register', {
        nome,
        email,
        senha,
        nomePublico: nomePublico || undefined, // Envia undefined se o campo estiver vazio
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Criar Conta</Text>
        <Text style={styles.subtitle}>Comece a gerir a sua coleção</Text>

        <Text style={styles.label}>Nome Completo *</Text>
        <TextInput style={styles.input} placeholder="Seu nome real" value={nome} onChangeText={setNome} />

        <Text style={styles.label}>Nome Público (Apelido)</Text>
        <TextInput style={styles.input} placeholder="Ex: O Rancho do Bonsai" value={nomePublico} onChangeText={setNomePublico} />
        
        <Text style={styles.label}>Localidade</Text>
        <TextInput style={styles.input} placeholder="Ex: Brasília - DF" value={localidade} onChangeText={setLocalidade} />
        
        <Text style={styles.label}>Email *</Text>
        <TextInput style={styles.input} placeholder="seuemail@exemplo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
        
        <Text style={styles.label}>Senha *</Text>
        <TextInput style={styles.input} placeholder="Mínimo 6 caracteres" value={senha} onChangeText={setSenha} secureTextEntry />
        
        <Text style={styles.label}>Confirmar Senha *</Text>
        <TextInput style={styles.input} placeholder="Repita a senha" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

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
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  label: {
    width: '100%',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'left',
  },
  input: {
    width: '100%',
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    width: '100%',
    height: 50,
    backgroundColor: '#28a745',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#a3d9b1',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
      marginTop: 20,
  },
  backButtonText: {
      color: '#007bff',
      fontSize: 16,
  }
});

export default RegisterScreen;