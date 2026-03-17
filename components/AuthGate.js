import React, { useEffect, useState } from "react";
import { View, Button, Text } from "react-native";

import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const auth = getAuth();
const provider = new GoogleAuthProvider();

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.log("Error login", e);
    }
  };

  const logout = () => {
    signOut(auth);
  };

  if (loading) {
    return <View><Text>Cargando...</Text></View>;
  }

  if (!user) {
    return (
      <View style={{ flex:1, justifyContent:"center", alignItems:"center" }}>
        <Text>Ubica-Pin</Text>
        <Button title="Entrar con Google" onPress={login} />
      </View>
    );
  }

  return (
  <>
    {children}
    <Button title="Cerrar sesión" onPress={logout} />
  </>
);
}