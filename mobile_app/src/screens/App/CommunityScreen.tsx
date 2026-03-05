import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { theme } from '../../constants/theme';
import UnderConstructionScreen from '../../components/UnderConstructionScreen';

// Código original da CommunityScreen mantido para reativação futura.
// A versão funcional com lista de utilizadores está no histórico git.

const CommunityScreen = () => {
  return (
    <SafeAreaView style={styles.container}>
      <UnderConstructionScreen
        title="Comunidade"
        message="A comunidade de bonsaístas está a ser desenvolvida. Aqui poderá partilhar, seguir e interagir com outros entusiastas. Volte em breve!"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});

export default CommunityScreen;
