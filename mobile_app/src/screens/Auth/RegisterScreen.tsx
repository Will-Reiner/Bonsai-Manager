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
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import api from '../../api'; // Usaremos a instância do axios diretamente

const RegisterScreen = () => {
  const navigation = useNavigation();

  // Estados para o formulário e controlo de loading
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    // Validações básicas no frontend
    if (!nome || !email || !senha || !confirmarSenha) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Erro', 'As senhas não coincidem.');
      return;
    }

    setIsLoading(true);
    try {
      // Chamada à API para registar o novo utilizador
      await api.post('/auth/register', {
        nome,
        email,
        senha,
      });

      Alert.alert(
        'Sucesso!',
        'A sua conta foi criada. Agora pode fazer o login.',
        [{ text: 'OK', onPress: () => navigation.goBack() }] // Volta para a tela de login
      );
    } catch (error: any) {
      // Trata erros comuns da API, como email já existente
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
      <Text style={styles.title}>Criar Conta</Text>
      <Text style={styles.subtitle}>Comece a gerir a sua coleção</Text>

      <TextInput style={styles.input} placeholder="Nome Completo" value={nome} onChangeText={setNome} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Senha (mínimo 6 caracteres)" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={styles.input} placeholder="Confirmar Senha" value={confirmarSenha} onChangeText={setConfirmarSenha} secureTextEntry />

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

    </KeyboardAvoidingView>
  );
};

// Estilos semelhantes aos da tela de Login
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
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