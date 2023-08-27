import { LocalStorage } from "@raycast/api";

let favorites = "";

/**
 * Delays the execution of code by the specified number of milliseconds.
 *
 * @param {number} ms - The number of milliseconds to delay the execution.
 * @return {Promise<void>} A Promise that resolves after the specified delay.
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getFavorite() {
  const favorites = await LocalStorage.getItem("favorites");
  if (!favorites) {
    return [];
  } else if (typeof favorites === "string") {
    return favorites.split(",");
  } else {
    return [];
  }
}

export async function addFavorite(timezone: string) {
  const favorites = await getFavorite();
  if (favorites.length === 0) {
    await LocalStorage.setItem("favorites", timezone);
  } else {
    await LocalStorage.setItem("favorites", favorites.join(","));
  }
}

export async function removeFavorite(timezone: string) {
  const favoriteCrypto = await getFavorite();
  if (!favoriteCrypto.includes(timezone)) {
    return;
  }
  favoriteCrypto.splice(favoriteCrypto.indexOf(timezone), 1);
  await LocalStorage.setItem("favoriteCrypto", favoriteCrypto.join(","));
}
