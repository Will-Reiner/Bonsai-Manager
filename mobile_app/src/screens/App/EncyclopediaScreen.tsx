import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { theme } from '../../constants/theme';

type EncyclopediaNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MainTabs'>;

const EncyclopediaScreen = () => {
  const navigation = useNavigation<EncyclopediaNavigationProp>();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Enciclopédia</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('SpeciesList')}
        >
          <Text style={styles.cardTitle}>Guia de Espécies</Text>
          <Text style={styles.cardDescription}>Encontre informações detalhadas sobre diversas espécies de bonsai.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          onPress={() => navigation.navigate('TechniquesList')}
        >
          <Text style={styles.cardTitle}>Guia de Técnicas</Text>
          <Text style={styles.cardDescription}>Aprenda sobre poda, aramagem, transplante e outras técnicas essenciais.</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing.medium,
    paddingVertical: theme.spacing.small,
    backgroundColor: theme.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.lightGray,
  },
  headerTitle: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight as any,
    color: theme.colors.text,
  },
  content: {
    padding: theme.spacing.large,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: theme.spacing.large,
    marginBottom: theme.spacing.large,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: theme.spacing.small,
    color: theme.colors.primary,
  },
  cardDescription: {
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.subtext,
  },
});

export default EncyclopediaScreen;