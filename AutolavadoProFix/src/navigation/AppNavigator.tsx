import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';

import LoginScreen from '../screens/LoginScreen';
import AdminDashboard from '../screens/admin/AdminDashboard';
import AdminEmployees from '../screens/admin/AdminEmployees';
import AdminWashes from '../screens/admin/AdminWashes';
import HistoryScreen from '../screens/shared/HistoryScreen';
import EmployeeDashboard from '../screens/employee/EmployeeDashboard';
import WashDetailScreen from '../screens/shared/WashDetailScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';

const Stack = createNativeStackNavigator();
const AdminTab = createBottomTabNavigator();
const EmpTab = createBottomTabNavigator();

const AdminTabs = () => (
  <AdminTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB', paddingTop: 4, height: 60 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 4 },
      tabBarIcon: ({ focused, color }) => {
        const icons: Record<string, [string, string]> = {
          Dashboard: ['grid', 'grid-outline'],
          Employees: ['people', 'people-outline'],
          Washes: ['car', 'car-outline'],
          History: ['time', 'time-outline'],
        };
        const [a, b] = icons[route.name] || ['apps', 'apps-outline'];
        return <Ionicons name={(focused ? a : b) as any} size={22} color={color} />;
      },
    })}
  >
    <AdminTab.Screen name="Dashboard" component={AdminDashboard} options={{ title: 'Dashboard' }} />
    <AdminTab.Screen name="Employees" component={AdminEmployees} options={{ title: 'Empleados' }} />
    <AdminTab.Screen name="Washes"    component={AdminWashes}    options={{ title: 'Lavados'   }} />
    <AdminTab.Screen name="History"   component={HistoryScreen}  options={{ title: 'Historial' }} />
  </AdminTab.Navigator>
);

const EmployeeTabs = () => (
  <EmpTab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: '#2563EB',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#E5E7EB', paddingTop: 4, height: 60 },
      tabBarLabelStyle: { fontSize: 10, fontWeight: '600', paddingBottom: 4 },
      tabBarIcon: ({ focused, color }) => {
        const icons: Record<string, [string, string]> = {
          Dashboard: ['car', 'car-outline'],
          History: ['time', 'time-outline'],
        };
        const [a, b] = icons[route.name] || ['apps', 'apps-outline'];
        return <Ionicons name={(focused ? a : b) as any} size={22} color={color} />;
      },
    })}
  >
    <EmpTab.Screen name="Dashboard" component={EmployeeDashboard} options={{ title: 'Mis Lavados' }} />
    <EmpTab.Screen name="History"   component={HistoryScreen}     options={{ title: 'Historial'  }} />
  </EmpTab.Navigator>
);

const MainTabs = () => {
  const { currentUser } = useApp();
  return currentUser?.role === 'admin' ? <AdminTabs /> : <EmployeeTabs />;
};

const AppNavigator = () => {
  const { currentUser } = useApp();

  return (
    <NavigationContainer>
      {!currentUser ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: '#2563EB' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="WashDetail" component={WashDetailScreen} options={{ title: 'Detalle del Lavado' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Mi Perfil' }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
