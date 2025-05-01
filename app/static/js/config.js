// config.js

export const MAP_API_KEY = '413787c6646b419f8984f1ba404b5c7f';
export const GOOGLE_MAPS_API_KEY = 'AIzaSyBNEzAZ_oPBcqiy20Dgcavik-9kAzU_lSg'; // Replace with your real API key

export const GEOCODER_URL = "https://photon.komoot.io/api"; // Legacy, not used for Google now
export const API_BASE_URL = "http://localhost:5050";

export async function safeFetchJSON(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}