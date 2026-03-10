import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking, TextInput, Alert, Platform, Share } from 'react-native';
import * as Location from 'expo-location';

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from "./firebase";
import { collection, addDoc, deleteDoc, updateDoc, doc, onSnapshot } from "firebase/firestore";
const APP_MODE = "firebase";

let MapView = null;
let Marker = null;

if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  MapView = maps.default;
  Marker = maps.Marker;
}

export default function App() {

  const [locations, setLocations] = useState([]);
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
 
  const [showMap, setShowMap] = useState(false);


useEffect(() => {

  const unsubscribe = onSnapshot(collection(db, "locations"), (snapshot) => {

    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setLocations(data);

  });

  return unsubscribe;

}, []);


const openMaps = (lat, lng) => {
  const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  Linking.openURL(url);
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



const addLocation = async () => {

  let coords;

  if (Platform.OS === "web") {

    coords = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position.coords),
        (error) => reject(error),
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });

  } else {

    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      alert("Permiso de ubicación denegado");
      return;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High
    });

    coords = location.coords;

  }

  const newLocation = {
  description: description || "Ubicación",
  latitude: coords.latitude,
  longitude: coords.longitude,
  date: new Date().toLocaleDateString()
};

  let updatedLocations;
//
  if (editingId) {

  const ref = doc(db, "locations", editingId);

  await updateDoc(ref, {
    description: description
  });

  setEditingId(null);

} else {

  await addDoc(collection(db, "locations"), newLocation);

}

setDescription("");
  setDescription("");
};


  



  const deleteLocation = async (id) => {
    await deleteDoc(doc(db, "locations", id));

   const filteredLocations = locations.filter(
  (location) => location.id !== id
);

setLocations(filteredLocations);

await AsyncStorage.setItem(
  "locations",
  JSON.stringify(filteredLocations)
);
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







  

  return (
    <View style={styles.container}>

      <View style={styles.headerRow}>
  <View style={styles.headerRow}>

  <Text style={styles.title}>📍 Ubica-Pin</Text>

  <View style={styles.modeBadge}>
    <Text style={styles.modeText}>
      {APP_MODE === "firebase" ? "☁ Sync" : "💾 Local"}
    </Text>
  </View>

</View>

  <View style={styles.modeBadge}>
    <Text style={styles.modeText}>☁ Firebase</Text>
  </View>
</View>

      <TextInput
        style={styles.input}
        placeholder="Descripción del lugar..."
        value={description}
        onChangeText={setDescription}
      />


<View style={styles.topButtonRow}>


  

  <TouchableOpacity
    style={[
      styles.addButton,
      editingId && { backgroundColor: "#ffc107" }
    ]}
    onPress={addLocation}
  >
    <Text style={styles.addButtonText}>
      {editingId ? "Guardar cambios" : "+ Nueva ubicación"}
    </Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.mapButton}
    onPress={() => setShowMap(!showMap)}
  >
    <Text style={styles.buttonText}>
      {showMap ? "Ocultar mapa" : "Ver mapa"}
    </Text>
  </TouchableOpacity>

</View>



{showMap && MapView && (
  <MapView
    style={styles.map}
    initialRegion={{
      latitude: locations.length ? locations[0].latitude : 40.4168,
      longitude: locations.length ? locations[0].longitude : -3.7038,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01
    }}
  >
    {locations.map((loc) => (
      <Marker
        key={loc.id}
        coordinate={{
          latitude: loc.latitude,
          longitude: loc.longitude
        }}
        title={loc.description}
        description={loc.date}
      />
    ))}
  </MapView>
)}


      <FlatList
        data={locations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.description}>{item.description}</Text>
           
          <Text style={styles.date}>📅 {item.date}</Text>

<View style={styles.buttonRow}>

  <TouchableOpacity
    style={styles.smallButton}
    onPress={() => openMaps(item.latitude, item.longitude)}
  >
    <Text style={styles.buttonText}> Maps</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={styles.smallEditButton}
    onPress={() => editLocation(item)}
  >
    <Text style={styles.buttonText}> Editar</Text>
  </TouchableOpacity>

  <TouchableOpacity
  style={styles.smallShareButton}
  onPress={() => shareLocation(item)}
>
  <Text style={styles.buttonText}> Enviar</Text>
</TouchableOpacity>

  <TouchableOpacity
    style={styles.smallDeleteButton}
    onPress={() => {
      if (Platform.OS === "web") {
        if (window.confirm("¿Seguro que quieres borrar esta ubicación?")) {
          deleteLocation(item.id);
        }
      } else {
        Alert.alert(
          "Eliminar ubicación",
          "¿Seguro que quieres borrar esta ubicación?",
          [
            { text: "Cancelar", style: "cancel" },
            { text: "Eliminar", onPress: () => deleteLocation(item.id) }
          ]
        );
      }
    }}
  >
    <Text style={styles.buttonText}> Borrar</Text>
  </TouchableOpacity>

</View>

          </View>
        )}
      />

      <StatusBar style="auto" />
    </View>
  );
}

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







});