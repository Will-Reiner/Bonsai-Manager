import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import ManageEspeciesScreen from '../Admin/ManageEspeciesScreen';
import ManageAtividadesScreen from '../Admin/ManageAtividadesScreen';
import ManageTiposRecursoScreen from '../Admin/ManageTiposRecursoScreen';

const Tab = createBottomTabNavigator();

const AdminScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Espécies" component={ManageEspeciesScreen} />
      <Tab.Screen name="Atividades" component={ManageAtividadesScreen} />
      <Tab.Screen name="Recursos" component={ManageTiposRecursoScreen} />
    </Tab.Navigator>
  );
};

export default AdminScreen;