import { tool } from "@langchain/core/tools";
import { z } from "zod";
import axios from "axios";

export const weatherTool = tool(
  async ({ location }) => {
    try {
      // Free open-meteo geocoding & weather API
      const geoRes = await axios.get(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1`
      );
      if (!geoRes.data?.results?.[0]) {
        return `Could not find weather data for location: ${location}`;
      }

      const { latitude, longitude, name, country } = geoRes.data.results[0];
      const weatherRes = await axios.get(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
      );

      const currentWeather = weatherRes.data?.current_weather;
      if (!currentWeather) {
        return `Could not retrieve current weather for ${name}.`;
      }

      return `The current weather in ${name}, ${country} is ${currentWeather.temperature}°C with wind speed of ${currentWeather.windspeed} km/h.`;
    } catch (err) {
      return `Failed to fetch weather for ${location}.`;
    }
  },
  {
    name: "getWeather",
    description: "Get real-time weather information for any city or location in the world",
    schema: z.object({
      location: z.string().describe("City or location name"),
    }),
  }
);
