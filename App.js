import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from "./screens/HomeScreen";
import SettingsScreen from "./screens/SettingsScreen";



const Stack = createNativeStackNavigator();

export default function App() {

  return (
    <NavigationContainer>
      <Stack.Navigator>

        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "📍 Ubica-Pin" }}
        />

        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: "⚙️ Ajustes" }}
        />

      </Stack.Navigator>
    </NavigationContainer>
  );

}
