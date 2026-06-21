import React, { useState, useRef, useLayoutEffect } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import TasksPanel, { TasksPanelHandle } from '../../components/TasksPanel';
import { RootStackParamList } from '../../navigation/AppNavigator';

type TasksScreenRouteProp = RouteProp<RootStackParamList, 'Tasks'>;
type TasksScreenNavProp = NativeStackNavigationProp<RootStackParamList, 'Tasks'>;

const TasksScreen = () => {
  const route = useRoute<TasksScreenRouteProp>();
  const navigation = useNavigation<TasksScreenNavProp>();

  const panelRef = useRef<TasksPanelHandle>(null);
  const [filtersActive, setFiltersActive] = useState(false);

  // Botão de filtragem no header (ao lado direito do título)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => panelRef.current?.openFilter()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.headerButton}
        >
          <MaterialCommunityIcons name="filter-variant" size={24} color={theme.colors.primary} />
          {filtersActive && <View style={styles.headerButtonDot} />}
        </TouchableOpacity>
      ),
    });
  }, [navigation, filtersActive]);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TasksPanel
        ref={panelRef}
        autoOpenIntervention={route.params?.openIntervention}
        onFiltersActiveChange={setFiltersActive}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerButton: {
    paddingHorizontal: theme.spacing.sm,
  },
  headerButtonDot: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.urgent,
  },
});

export default TasksScreen;
