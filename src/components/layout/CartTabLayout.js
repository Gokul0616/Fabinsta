import { createStackNavigator } from "@react-navigation/stack";
import React, { useCallback } from "react";
import Checkout from "../../components/CheckOut/Checkout";
import CartDetails from "../cart/CartDetails";
import { useFocusEffect } from "@react-navigation/native";

const Stack = createStackNavigator();

const CartTabLayout = () => {
  return (
    <Stack.Navigator
      initialRouteName="cart"
      screenOptions={{
        gestureEnabled: false,
        headerShown: false,
        cardStyleInterpolator: ({ current, next, inverted, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen name="cart" component={CartDetails} />
      <Stack.Screen name="checkout" component={Checkout} />
    </Stack.Navigator>
  );
};

export default CartTabLayout;