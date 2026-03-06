import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, Linking, TextInput, Alert, Platform } from 'react-native';
import * as Location from 'expo-location';

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
    loadLocations();
  }, []);

  const openMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    Linking.openURL(url);
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
    id: Date.now().toString(),
    description: description || "Ubicación",
    latitude: coords.latitude,
    longitude: coords.longitude,
    date: new Date().toLocaleDateString()
  };

  let updatedLocations;

  if (editingId) {

    updatedLocations = locations.map((loc) =>
      loc.id === editingId
        ? { ...loc, description }
        : loc
    );

    setEditingId(null);

  } else {

    updatedLocations = [newLocation, ...locations];

  }

  setLocations(updatedLocations);

  await AsyncStorage.setItem(
    "locations",
    JSON.stringify(updatedLocations)
  );

  setDescription("");
};


  



  const deleteLocation = async (id) => {

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
  Alert.alert(
    "Eliminar ubicación",
    "¿Seguro que quieres borrar esta ubicación?",
    [
      {
        text: "Cancelar",
        style: "cancel"
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => deleteLocation(id)
      }
    ]
  );
};





  const loadLocations = async () => {
    try {
      const savedLocations = await AsyncStorage.getItem("locations");

      if (savedLocations !== null) {
        setLocations(JSON.parse(savedLocations));
      }
    } catch (error) {
      console.log("Error cargando ubicaciones", error);
    }
  };

  return (
    <View style={styles.container}>

      <Text style={styles.title}>📍 Ubica-Pin</Text>

      <TextInput
        style={styles.input}
        placeholder="Descripción del lugar..."
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.addButton} onPress={addLocation}>
        <Text style={styles.addButtonText}>+ Nueva ubicación</Text>
      </TouchableOpacity>

      <TouchableOpacity
  style={styles.mapButton}
  onPress={() => setShowMap(!showMap)}
>
  <Text style={styles.buttonText}>
    {showMap ? "Ocultar mapa" : "Ver mapa"}
  </Text>
</TouchableOpacity>

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

            <TouchableOpacity
  style={styles.button}
  onPress={() => openMaps(item.latitude, item.longitude)}
>
  <Text style={styles.buttonText}>Abrir en Maps</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.editButton}
  onPress={() => editLocation(item)}
>
  <Text style={styles.buttonText}>Editar</Text>
</TouchableOpacity>

<TouchableOpacity
  style={styles.deleteButton}
  onPress={() => confirmDelete(item.id)}
>
  <Text style={styles.buttonText}>Eliminar</Text>
</TouchableOpacity>

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
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 20
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 20
  },

  addButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20
  },

  addButtonText: {
    color: "white",
    fontWeight: "bold"
  },

  card: {
    backgroundColor: "#f2f2f2",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15
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
  backgroundColor: "#6f42c1",
  padding: 12,
  borderRadius: 8,
  alignItems: "center",
  marginBottom: 20
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
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10
  },

  editButton: {
  marginTop: 8,
  backgroundColor: "#ffc107",
  padding: 10,
  borderRadius: 6,
  alignItems: "center"
},

});