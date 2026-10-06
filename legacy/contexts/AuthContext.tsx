import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type Usuario,
  cadastrarUsuario,
  clearSessao,
  getSessao,
  getUsuarioById,
  loginUsuario,
  setSessao,
} from '../db/queries';

type AuthResult = { success: true } | { success: false; erro: string };

type AuthContextType = {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => AuthResult;
  logout: () => void;
  cadastrar: (nome: string, email: string, senha: string) => AuthResult;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const uid = getSessao();
      console.log('Sessão encontrada:', uid);
      if (uid) {
        const u = getUsuarioById(uid);
        if (u) setUsuario(u);
      } else {
        console.log('Nenhuma sessão ativa');
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  function login(email: string, senha: string): AuthResult {
    const u = loginUsuario(email.trim(), senha);
    if (u) {
      setSessao(u.id);
      setUsuario(u);
      return { success: true };
    }
    return { success: false, erro: 'E-mail ou senha incorretos' };
  }

  function logout() {
    clearSessao();
    setUsuario(null);

  }

  function cadastrar(nome: string, email: string, senha: string): AuthResult {
    try {
      const u = cadastrarUsuario(nome.trim(), email.trim(), senha);
      setSessao(u.id);
      setUsuario(u);
      return { success: true };
    } catch {
      return { success: false, erro: 'E-mail já cadastrado' };
    }
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout, cadastrar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
