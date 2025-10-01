import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Usuario } from '../../types';
import UserListItem from '../../components/UserListItem';

type UserListScreenRouteProp = RouteProp<RootStackParamList, 'UserList'>;
type UserListNavigationProp = NativeStackNavigationProp<RootStackParamList, 'UserList'>;

const UserListScreen = () => {
  const route = useRoute<UserListScreenRouteProp>();
  const navigation = useNavigation<UserListNavigationProp>();
  const { users, title } = route.params;

  return (
    <View style={styles.container}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id!}
        renderItem={({ item }) => (
          <UserListItem
            user={item}
            onPress={() => navigation.push('PublicProfile', { userId: item.id! })}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum utilizador nesta lista.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});

export default UserListScreen;