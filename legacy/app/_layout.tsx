import '../db/client';

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

function NavigationGuard() {
  const { usuario, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!usuario && !inAuthGroup) {
      router.replace('/auth/inicio');
    } else if (usuario && inAuthGroup) {
      router.replace('/');
    }
  }, [usuario, loading]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/inicio" options={{ headerShown: false }} />
        <Stack.Screen
          name="novo-servico"
          options={{
            presentation: 'modal',
            title: 'Novo Serviço',
            headerTintColor: '#16a34a',
            headerTitleStyle: { fontSize: 20, fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="novo-agendamento"
          options={{
            presentation: 'modal',
            title: 'Novo Agendamento',
            headerTintColor: '#16a34a',
            headerTitleStyle: { fontSize: 20, fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="cliente/[id]"
          options={{
            title: 'Cliente',
            headerTintColor: '#16a34a',
            headerTitleStyle: { fontSize: 20, fontWeight: '700' },
          }}
        />
      </Stack>
      <NavigationGuard />
    </AuthProvider>
  );
}
