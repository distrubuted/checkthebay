// Simple Node.js script to fetch the ARCOS Sea Lab monitoring page and save the latest readings.
// Safe to run frequently (e.g., every 5 minutes) because it fetches once and overwrites latest.json.

const fs = require("fs/promises");

// Public ARCOS Sea Lab monitoring page to poll for readings
const ARCOS_URL = "https://arcos.disl.org/platforms/sealab/";

// Helper to find the first matching text that follows any of the provided labels
function extractTextAfterLabel(pageText, labels) {
  for (const label of labels) {
    const pattern = new RegExp(label + "\\s*:?\\s*([^\\n<]*)", "i");
    const match = pageText.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1].trim();
      if (cleaned.length > 0) {
        return cleaned;
      }
    }
  }
  return null;
}

// Helper to pull a numeric value that may include decimals from the text following any label
function extractNumberAfterLabel(pageText, labels) {
  const text = extractTextAfterLabel(pageText, labels);
  if (!text) return null;
  const numberMatch = text.match(/-?\d+(?:\.\d+)?/);
  return numberMatch ? Number(numberMatch[0]) : null;
}

async function fetchLatestReadings() {
  // Fetch the public monitoring webpage
  const response = await fetch(ARCOS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch ARCOS page: ${response.status} ${response.statusText}`);
  }

  const pageText = await response.text();

  // Attempt to pull the latest visible readings using flexible label matching
  const latestReadings = {
    timestamp: extractTextAfterLabel(pageText, [
      "Last Updated",
      "Last Update",
      "Date/Time",
      "Timestamp"
    ]),
    waterTemperature: extractNumberAfterLabel(pageText, [
      "Water Temp",
      "Water Temperature",
      "Temperature"
    ]),
    salinity: extractNumberAfterLabel(pageText, ["Salinity", "Salinity PSU", "Salinity ppt"]),
    dissolvedOxygen: extractNumberAfterLabel(pageText, [
      "Dissolved Oxygen",
      "DO",
      "Dissolved O2"
    ]),
    turbidity: extractNumberAfterLabel(pageText, ["Turbidity", "NTU"]),
    ph: extractNumberAfterLabel(pageText, ["pH", "PH"])
  };

  // Write the JSON file with nulls for any missing values
  await fs.writeFile("latest.json", JSON.stringify(latestReadings, null, 2));
  console.log("latest.json written");
}

fetchLatestReadings().catch((error) => {
  // Log errors without leaving partial files behind
  console.error("Error updating latest readings:", error.message);
  process.exitCode = 1;
});
