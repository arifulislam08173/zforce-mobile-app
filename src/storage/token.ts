import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

export const TOKEN_KEY = "ZF_TOKEN";
export const USER_KEY = "ZF_USER";

export async function setItem(key: string, value: string) {
  if (isWeb) {
    localStorage.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function getItem(key: string) {
  if (isWeb) return localStorage.getItem(key);
  return await SecureStore.getItemAsync(key);
}

export async function removeItem(key: string) {
  if (isWeb) {
    localStorage.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
