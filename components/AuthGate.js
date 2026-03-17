import React, { useEffect, useState } from "react";
import { View, Button, Text, StyleSheet, ActivityIndicator } from "react-native";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  signOut
} from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Configuramos persistencia y escuchamos el estado
    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
      } catch (e) {
        console.error("Error persistencia:", e);
      }
    };

    initializeAuth();

    // 2. Procesar el resultado del redirect (importante para el primer login)
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log("Login exitoso vía redirect:", result.user.email);
          setUser(result.user);
        }
      })
      .catch((error) => {
        console.error("Error en redirect result:", error);
      });

    // 3. Escuchador principal (mantiene la sesión activa al recargar)
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Estado de Auth:", u ? u.email : "Cerrado");
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithRedirect(auth, provider);
    } catch (e) {
      console.error("Error al iniciar login:", e);
    }
  };

  const logout = () => {
    signOut(auth);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 10 }}>Verificando acceso...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Ubica-Pin</Text>
        <Text style={styles.subtitle}>Acceso restringido</Text>
        <Button title="Entrar con Google" onPress={login} color="#4285F4" />
      </View>
    );
  }

  // Si hay usuario, mostramos la app (children)
  return children;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
});