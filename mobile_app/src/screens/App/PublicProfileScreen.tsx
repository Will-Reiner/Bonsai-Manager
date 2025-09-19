import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Image, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { userService, PublicUserProfile } from '../../services/userService';
import { RootStackParamList } from '../../navigation/AppNavigator';
import PlantListItem from '../../components/PlantListItem';
import { useAuth } from '../../context/AuthContext';
import api from '../../api'; // Importamos o api para buscar os dados do utilizador logado

type PublicProfileRouteProp = RouteProp<RootStackParamList, 'PublicProfile'>;

const PublicProfileScreen = () => {
  const route = useRoute<PublicProfileRouteProp>();
  const { userId } = route.params;
  const { user: currentUser } = useAuth(); // O nosso utilizador logado

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfileAndFollowStatus = async () => {
      try {
        // Buscamos o perfil público e os dados do nosso próprio perfil em paralelo
        const [profileData, meData] = await Promise.all([
          userService.getUserProfileById(userId),
          api.get('/auth/me') // O backend precisa de retornar os 'seguindo'
        ]);

        setProfile(profileData);

        // Verificamos se já seguimos este utilizador
        // NOTA: O backend precisa de ser atualizado para retornar esta informação em /auth/me
        const currentlyFollowing = meData.data.seguindo?.some((amizade: any) => amizade.seguidoId === userId);
        setIsFollowing(currentlyFollowing);

      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar este perfil.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileAndFollowStatus();
  }, [userId]);
  
  const handleFollowToggle = async () => {
      setIsFollowLoading(true);
      const originalFollowState = isFollowing;
      
      // Atualização Otimista
      setIsFollowing(!originalFollowState);

      try {
          if (originalFollowState) {
              await userService.unfollowUser(userId);
          } else {
              await userService.followUser(userId);
          }
      } catch (error) {
          Alert.alert("Erro", `Não foi possível ${originalFollowState ? 'deixar de seguir' : 'seguir'} o utilizador.`);
          // Reverte a mudança em caso de erro
          setIsFollowing(originalFollowState);
      } finally {
          setIsFollowLoading(false);
      }
  };


  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (!profile) {
    return <View style={styles.centered}><Text>Perfil não encontrado ou privado.</Text></View>;
  }

  const placeholderImage = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';

  // Não mostramos o botão de seguir no nosso próprio perfil
  const isMyOwnProfile = currentUser?.id === profile.id;

  return (
    <FlatList
        style={styles.container}
        ListHeaderComponent={
            <>
                <View style={styles.header}>
                    <Image source={{ uri: profile.fotoPerfilUrl || placeholderImage }} style={styles.avatar} />
                    <Text style={styles.name}>{profile.nomePublico}</Text>
                    <Text style={styles.location}>{profile.localidade}</Text>
                    <Text style={styles.bio}>{profile.bio}</Text>
                    
                    {!isMyOwnProfile && (
                        <TouchableOpacity 
                            style={[styles.followButton, isFollowing ? styles.unfollowButton : {}]}
                            onPress={handleFollowToggle}
                            disabled={isFollowLoading}
                        >
                            <Text style={styles.followButtonText}>
                                {isFollowLoading ? 'Aguarde...' : isFollowing ? 'A Seguir' : 'Seguir'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
                <Text style={styles.listHeader}>Plantas Públicas</Text>
            </>
        }
        data={profile.plantas}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => <PlantListItem planta={item as any} onPress={() => {}} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Este utilizador não tem plantas públicas.</Text>}
    />
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: { backgroundColor: '#fff', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    avatar: { width: 100, height: 100, borderRadius: 50, marginBottom: 10, backgroundColor: '#e9ecef' },
    name: { fontSize: 22, fontWeight: 'bold' },
    location: { fontSize: 16, color: '#6c757d', marginTop: 4 },
    bio: { fontSize: 16, color: '#495057', textAlign: 'center', marginTop: 10, marginHorizontal: 20 },
    followButton: {
        marginTop: 15,
        backgroundColor: '#007bff',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 20,
    },
    unfollowButton: {
        backgroundColor: '#6c757d',
    },
    followButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    listHeader: { fontSize: 18, fontWeight: 'bold', padding: 15 },
    emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' }
});

export default PublicProfileScreen;