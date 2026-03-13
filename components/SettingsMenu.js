import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function SettingsMenu({ visible, onExport, onImport }) {

  if (!visible) return null;

return (

  <View style={styles.overlay}>

    <TouchableOpacity
      style={styles.background}
      activeOpacity={1}
      onPress={onClose}
    />

    <View style={styles.menu}>

      <TouchableOpacity
        style={styles.item}
        onPress={onExport}
      >
        <Text>Exportar ubicaciones</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.item}
        onPress={onImport}
      >
        <Text>Importar ubicaciones</Text>
      </TouchableOpacity>

    </View>

  </View>

);

}

const styles = StyleSheet.create({

  overlay:{
    position:"absolute",
    top:0,
    left:0,
    right:0,
    bottom:0,
    justifyContent:"flex-start",
    alignItems:"flex-end",
    zIndex:1000
  },

  background:{
    position:"absolute",
    top:0,
    left:0,
    right:0,
    bottom:0
  },

  menu:{
    marginTop:70,
    marginRight:10,
    width:200,
    backgroundColor:"#ffffff",
    borderRadius:10,
    elevation:6,
    shadowColor:"#000",
    shadowOpacity:0.2,
    shadowOffset:{width:0,height:2}
  },

  item:{
    padding:15,
    borderBottomWidth:1,
    borderBottomColor:"#eee"
  }

});