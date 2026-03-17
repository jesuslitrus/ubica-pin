import { StatusBar } from 'expo-status-bar';
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking, TextInput, Alert, Platform, Share } from 'react-native';
import * as Location from 'expo-location';

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from "./firebase";
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
import SettingsMenu from "./components/SettingsMenu";
import AuthGate from "./components/AuthGate";

const LOCAL_STORAGE_KEY = "ubicapin_locations";

let MapView = null;
let Marker = null;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

export default function App() {

  const [locations, setLocations] = useState([]);
  const [appMode, setAppMode] = useState("firebase");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
 
  const [showMap, setShowMap] = useState(false);
  const [localCount, setLocalCount] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

useEffect(() => {

  if (appMode !== "firebase") return;

  const unsubscribe = onSnapshot(collection(db, "locations"), (snapshot) => {

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setLocations(data);

  });

  return unsubscribe;

}, [appMode]); 


const saveLocationLocal = async (location) => {

  const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);

  let locationsLocal = stored ? JSON.parse(stored) : [];

  locationsLocal.push({
    id: Date.now().toString(),
    ...location
  });

  await AsyncStorage.setItem(
    LOCAL_STORAGE_KEY,
    JSON.stringify(locationsLocal)
  );

};

const openMaps = (lat, lng) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url);
};


const loadLocalLocations = async () => {

  const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);

  if (stored) {

    const data = JSON.parse(stored);

    setLocations(data);
    setLocalCount(data.length);

  } else {

    setLocalCount(0);

  }

};

const syncLocalToFirebase = async () => {

  const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);

  if (!stored) return;

  const localLocations = JSON.parse(stored);

  if (localLocations.length === 0) return;

  for (const loc of localLocations) {

    const { id, ...data } = loc;

    await addDoc(collection(db, "locations"), data);

  }

  await AsyncStorage.removeItem(LOCAL_STORAGE_KEY);
  setLocalCount(0);

};
const shareLocation = async (location) => {

  const url = `https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;

  try {

    await Share.share({
      message: `${location.description}\n📍 ${url}`
    });

  } catch (error) {
    console.log(error);
  }

};


//------------------------------------------------------------------
const addLocation = async () => {
    let coords;

    if (Platform.OS === "web") {
      coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve(position.coords),
          (error) => reject(error),
          {
            enableHighAccuracy: true, // Despierta el GPS real en iOS
            timeout: 15000,           // Tiempo para capturar señal
            maximumAge: 0             // PROHÍBE usar la ubicación fija 40.25...
          }
        );
      });
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "Se necesita permiso para acceder a la ubicación.");
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      coords = location.coords;
    }

    if (appMode === "firebase") {
      try {
        // Aseguramos que latitude y longitude sean números antes de enviar a Firebase
        await addDoc(collection(db, "locations"), {
          description: description,
          latitude: Number(coords.latitude),  // Forzamos número
          longitude: Number(coords.longitude), // Forzamos número
          date: new Date().toISOString(),
        });

        setDescription("");
        setEditingId(null);
      } catch (e) {
        console.error("Error al añadir a Firebase:", e);
        Alert.alert("Error", "No tienes permisos para guardar o los datos son incorrectos.");
      }
    } else {
      // Lógica para modo local (AsyncStorage)
      const newLocation = {
        id: Date.now().toString(),
        description,
        latitude: coords.latitude,
        longitude: coords.longitude,
        date: new Date().toLocaleString(),
      };
      const updated = [newLocation, ...locations];
      setLocations(updated);
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      setDescription("");
    }
  };

//--------------------------------------------------
  



const deleteLocation = async (id) => {

  if (appMode === "firebase") {

    await deleteDoc(doc(db, "locations", id));

  } else {

    const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
const local = stored ? JSON.parse(stored) : [];

const updated = local.filter(loc => loc.id !== id);

await AsyncStorage.setItem(
  LOCAL_STORAGE_KEY,
  JSON.stringify(updated)
);

setLocalCount(updated.length);
setLocations(updated);

  }

};


  const editLocation = (location) => {
  setDescription(location.description);
  setEditingId(location.id);
};


const confirmDelete = (id) => {

  console.log("CONFIRM DELETE EJECUTADO", id);

  if (Platform.OS === "web") {

    const confirmed = window.confirm("¿Seguro que quieres borrar esta ubicación?");
    
    if (confirmed) {
      deleteLocation(id);
    }

  } else {

    Alert.alert(
      "Eliminar ubicación",
      "¿Seguro que quieres borrar esta ubicación?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", onPress: () => deleteLocation(id) }
      ]
    );

  }

};


const toggleMode = async () => {

  const newMode = appMode === "firebase" ? "local" : "firebase";

  if (Platform.OS === "web") {

    const confirmed = window.confirm(
      `¿Seguro que quieres cambiar a modo ${newMode}?`
    );

    if (confirmed) {
      if (newMode === "firebase") {

  const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);

  if (stored) {

    const localLocations = JSON.parse(stored);

    if (localLocations.length > 0) {

      if (Platform.OS === "web") {

        const confirmed = window.confirm(
          `Hay ${localLocations.length} ubicaciones locales. ¿Sincronizarlas con Firebase?`
        );

        if (confirmed) {
          await syncLocalToFirebase();
        }

      } else {

        Alert.alert(
          "Sincronizar ubicaciones",
          `Hay ${localLocations.length} ubicaciones locales. ¿Deseas sincronizarlas con Firebase?`,
          [
            { text: "Cancelar", style: "cancel" },
            {
              text: "Sincronizar",
              onPress: async () => {
                await syncLocalToFirebase();
              }
            }
          ]
        );

      }

    }

  }

}

setAppMode(newMode);
setEditingId(null);
setDescription("");

if (newMode === "firebase") {

  // recargar datos de Firebase
  setLocations([]);

}

if (newMode === "local") {

  setLocations([]);
  loadLocalLocations();

}


    }

  } else {

    Alert.alert(
      "Cambiar modo",
      `¿Seguro que quieres cambiar a modo ${newMode}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí", onPress: () => setAppMode(newMode) }
      ]
    );

  }

};





//
const exportLocations = () => {

  if (!locations || locations.length === 0) {
    alert("No hay ubicaciones para exportar");
    return;
  }

  const json = JSON.stringify(locations, null, 2);

  if (Platform.OS === "web") {

   const blob = new Blob([json], { type: "application/json" });
//------------------------------------------------
const prefix = appMode === "firebase" ? "S_" : "L_";
const filename = `${prefix}ubicapin_locations.json`;

const dataStr =
  "data:text/json;charset=utf-8," +
  encodeURIComponent(JSON.stringify(locations, null, 2));

const link = document.createElement("a");
link.setAttribute("href", dataStr);
link.setAttribute("download", filename);

document.body.appendChild(link);
link.click();
document.body.removeChild(link);

  } else {

    Share.share({
      message: json,
      title: "Ubica-Pin locations"
    });

  }

};

const importLocations = async () => {

  try {

    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json"
    });

    if (result.canceled) return;

    const fileUri = result.assets[0].uri;

    let content;

if (Platform.OS === "web") {

  const response = await fetch(fileUri);
  content = await response.text();

} else {

  content = await FileSystem.readAsStringAsync(fileUri);

}

    const importedLocations = JSON.parse(content);

    if (!Array.isArray(importedLocations)) {

      alert("Archivo inválido");
      return;

    }

    if (appMode === "firebase") {

      for (const loc of importedLocations) {

        const { id, ...data } = loc;

        await addDoc(collection(db, "locations"), data);

      }

    } else {

      const stored = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);

      const local = stored ? JSON.parse(stored) : [];

      const merged = [...local, ...importedLocations];

      await AsyncStorage.setItem(
        LOCAL_STORAGE_KEY,
        JSON.stringify(merged)
      );

      setLocations(merged);
      setLocalCount(merged.length);

    }

  } catch (error) {

    console.log("Error importando:", error);

  }

};
//---------------------------------------------------------------------
return (
    <AuthGate>
      <View style={styles.container}>
        <View style={styles.topButtonRow}>
          <Text style={styles.title}>Ubica-Pin</Text>
          <TouchableOpacity onPress={() => setShowMenu(true)} style={styles.menuButton}>
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Descripción del lugar..."
          value={description}
          onChangeText={setDescription}
        />

        <TouchableOpacity style={styles.addButton} onPress={addLocation}>
          <Text style={styles.addButtonText}>
            {editingId ? "Actualizar Pin" : "📍 Guardar Ubicación Actual"}
          </Text>
        </TouchableOpacity>

        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          renderItem={renderLocation}
        />

        <SettingsMenu
          visible={showMenu}
          onClose={() => setShowMenu(false)}
          appMode={appMode}
          setAppMode={setAppMode}
          localCount={locations.length}
          onImport={handleImport}
          onExport={handleExport}
        />

        <StatusBar style="auto" />
      </View>
    </AuthGate>
  );
}
//-------------------------------------------------------------------
const styles = StyleSheet.create({

  container: {
  flex: 1,
  backgroundColor: "#544F4F",
  paddingTop: 60,
  paddingHorizontal: 20
},

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20
  },

 addButton: {
  flex: 1,
  backgroundColor: "#28a745",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  marginRight: 5
},

  addButtonText: {
    color: "white",
    fontWeight: "bold"
  },

 card: {
  backgroundColor: "#D1CCCC",
  padding: 16,
  borderRadius: 14,
  marginBottom: 14,
  shadowColor: "#000",
  shadowOpacity: 0.12,
  shadowRadius: 6,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3
},

  description: {
    fontSize: 18,
    fontWeight: "600"
  },

  date: {
    marginTop: 5,
    color: "#666"
  },

  button: {
    marginTop: 10,
    backgroundColor: "#007AFF",
    padding: 10,
    borderRadius: 6,
    alignItems: "center"
  },

mapButton: {
  flex: 1,
  backgroundColor: "#6f42c1",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  marginLeft: 5
},

map: {
  width: "100%",
  height: 300,
  marginBottom: 20,
  borderRadius: 10
},

  deleteButton: {
    marginTop: 8,
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 6,
    alignItems: "center"
  },

  buttonText: {
    color: "white",
    fontWeight: "bold"
  },

  input: {
  backgroundColor: "#ffffff",
  borderWidth: 1,
  borderColor: "#c9ced6",
  borderRadius: 10,
  padding: 12,
  marginBottom: 12
},

  editButton: {
  marginTop: 8,
  backgroundColor: "#ffc107",
  padding: 10,
  borderRadius: 6,
  alignItems: "center"
},

buttonRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginTop: 10
},

smallButton: {
  flex: 1,
  backgroundColor: "#007AFF",
  paddingVertical: 8,
  borderRadius: 20,
  alignItems: "center",
  marginRight: 5
},

smallEditButton: {
  flex: 1,
  backgroundColor: "#ffc107",
  paddingVertical: 8,
  borderRadius: 20,
  alignItems: "center",
  marginHorizontal: 5
},

smallDeleteButton: {
  flex: 1,
  backgroundColor: "#dc3545",
  paddingVertical: 8,
  borderRadius: 20,
  alignItems: "center",
  marginLeft: 5
},



smallShareButton: {
  flex: 1,
  backgroundColor: "#17a2b8",
  paddingVertical: 8,
  borderRadius: 20,
  alignItems: "center",
  marginHorizontal: 5
},





topButtonRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 20
},

headerRow: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20
},

modeBadge: {
  backgroundColor: "#007AFF",
  paddingHorizontal: 10,
  paddingVertical: 4,
  borderRadius: 12
},

modeText: {
  color: "white",
  fontSize: 12,
  fontWeight: "bold"
},
settingsButton: {
  position: "absolute",
  top: 5,
  right: 5,
  zIndex: 10
},

settingsButton: {
  position: "absolute",
  top: 10,
  right: 15,
  zIndex: 20
},







});