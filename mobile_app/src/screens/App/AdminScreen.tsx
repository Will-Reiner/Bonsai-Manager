import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import ManageEspeciesScreen from '../Admin/ManageEspeciesScreen';
import ManageAtividadesScreen from '../Admin/ManageAtividadesScreen';
import ManageTiposRecursoScreen from '../Admin/ManageTiposRecursoScreen';

const Tab = createMaterialTopTabNavigator();

const AdminScreen = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Espécies" component={ManageEspeciesScreen} />
      {/* As outras telas de gestão serão adicionadas aqui */}
      { <Tab.Screen name="Atividades" component={ManageAtividadesScreen} /> }
      { <Tab.Screen name="Recursos" component={ManageTiposRecursoScreen} /> }
    </Tab.Navigator>
  );
};

export default AdminScreen;