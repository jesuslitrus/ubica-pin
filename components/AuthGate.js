import React, { useEffect, useState } from "react";
import { View, Button, Text } from "react-native";
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

const unsubscribe = onAuthStateChanged(auth, (u) => {
  console.log("USER:", u);
  setUser(u);
  setLoading(false); // 👈 AÑADE ESTO
});

const auth = getAuth();
const provider = new GoogleAuthProvider();

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {

  getRedirectResult(auth)
    .then((result) => {
      if (result?.user) {
        console.log("REDIRECT USER:", result.user);
      }
    })
    .catch((error) => {
      console.log("Redirect error:", error);
    });

  const unsubscribe = onAuthStateChanged(auth, (u) => {
  console.log("USER:", u);
  setUser(u);
  setLoading(false); // 👈 AÑADE ESTO
});

  return unsubscribe;
}, []);

 const login = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
    await signInWithRedirect(auth, provider);
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
  <View style={{ flex: 1 }}>
    {children}
    <Button title="Cerrar sesión" onPress={logout} />
  </View>
);
}