const fetch = require("node-fetch");

async function getLocationFromGoogle(lat, lon) {
  if (!lat || !lon) return { city: "NAN", latitude: "NAN", longitude: "NAN" };

  try {
    const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_API_KEY) throw new Error("Missing Google Maps API key");

    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== "OK") throw new Error("Failed to get location");

    const components = data.results[0]?.address_components || [];
    const cityObj = components.find(c => c.types.includes("locality")) || {};
    const city = cityObj.long_name || "NAN";

    return {
      city,
      latitude: lat || "NAN",
      longitude: lon || "NAN"
    };
  } catch (err) {
    console.error("Error fetching location:", err.message);
    return { city: "NAN", latitude: "NAN", longitude: "NAN" };
  }
}

module.exports = getLocationFromGoogle;
