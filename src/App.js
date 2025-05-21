import React, { useState } from 'react';

const api = {
  key: "15e69bbbc3b6dc183a36a61d252421f8", // Your OpenWeatherMap API key
  base: "https://api.openweathermap.org/data/2.5/"
}

function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState({});
  const [forecast, setForecast] = useState([]); // State for 5-day forecast
  const [error, setError] = useState(null);     // State for error handling
  const [loading, setLoading] = useState(false); // State for loading indicator

  const search = async evt => {
    if (evt.key === "Enter") {
      setLoading(true);
      setError(null); // Clear previous errors

      try {
        // Fetch current weather
        const currentWeatherRes = await fetch(`${api.base}weather?q=${query}&units=metric&APPID=${api.key}`);
        const currentWeatherResult = await currentWeatherRes.json();

        if (currentWeatherResult.cod !== 200) {
          setError(currentWeatherResult.message || "City not found. Please try again.");
          setLoading(false);
          setWeather({}); // Clear previous weather data
          setForecast([]); // Clear previous forecast data
          return;
        }

        setWeather(currentWeatherResult);

        // Fetch 5-day forecast
        const forecastRes = await fetch(`${api.base}forecast?q=${query}&units=metric&APPID=${api.key}`);
        const forecastResult = await forecastRes.json();

        // Note: forecast API returns "200" as a string for success
        if (forecastResult.cod !== "200") {
          setError(forecastResult.message || "Could not fetch forecast data.");
          setLoading(false);
          setWeather({});
          setForecast([]);
          return;
        }

        // Process forecast data to get daily summaries
        const dailyForecasts = processForecastData(forecastResult.list);
        setForecast(dailyForecasts);

        setQuery(''); // Clear the search input
        console.log("Current Weather:", currentWeatherResult);
        console.log("5-Day Forecast:", forecastResult);

      } catch (err) {
        setError("Could not fetch weather data. Please check the city name or your internet connection.");
        console.error("Error fetching weather:", err);
        setWeather({});
        setForecast([]);
      } finally {
        setLoading(false);
      }
    }
  }

  const dateBuilder = (d) => {
    let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    let day = days[d.getDay()];
    let date = d.getDate();
    let month = months[d.getMonth()];
    let year = d.getFullYear();

    return `${day} ${date} ${month} ${year}`
  }

  // Function to process 5-day / 3-hour forecast data into daily summaries
  const processForecastData = (list) => {
    const dailyData = {};

    list.forEach(item => {
      const date = new Date(item.dt * 1000); // Convert Unix timestamp to Date object
      // Use 'en-GB' locale to ensure consistent date formatting (e.g., Wed, 21 May)
      const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

      if (!dailyData[day]) {
        dailyData[day] = {
          temps: [],
          descriptions: [],
          icons: [],
          humidity: [],
          wind_speed: []
        };
      }
      dailyData[day].temps.push(item.main.temp);
      dailyData[day].descriptions.push(item.weather[0].description);
      dailyData[day].icons.push(item.weather[0].icon);
      dailyData[day].humidity.push(item.main.humidity);
      dailyData[day].wind_speed.push(item.wind.speed);
    });

    // Take the average/most common for each day
    const averagedDailyForecast = Object.keys(dailyData).map(day => {
      const temps = dailyData[day].temps;
      const descriptions = dailyData[day].descriptions;
      const icons = dailyData[day].icons;
      const humidity = dailyData[day].humidity;
      const wind_speed = dailyData[day].wind_speed;

      const avgTemp = Math.round(temps.reduce((sum, t) => sum + t, 0) / temps.length);
      const avgHumidity = Math.round(humidity.reduce((sum, h) => sum + h, 0) / humidity.length);
      // Wind speed can be tricky to average as it's a vector, but a simple average is often used for general forecast.
      const avgWindSpeed = (wind_speed.reduce((sum, ws) => sum + ws, 0) / wind_speed.length).toFixed(1);

      // Simple way to get the most frequent description/icon for the day (can be improved for more robust results)
      const getMostFrequent = (arr) => {
        if (arr.length === 0) return '';
        const counts = {};
        let maxCount = 0;
        let mostFrequent = arr[0];
        for (const item of arr) {
          counts[item] = (counts[item] || 0) + 1;
          if (counts[item] > maxCount) {
            maxCount = counts[item];
            mostFrequent = item;
          }
        }
        return mostFrequent;
      };

      const mostFrequentDescription = getMostFrequent(descriptions);
      const mostFrequentIcon = getMostFrequent(icons);

      return {
        date: day,
        temp: avgTemp,
        description: mostFrequentDescription,
        icon: mostFrequentIcon,
        humidity: avgHumidity,
        wind_speed: avgWindSpeed
      };
    }).slice(0, 5); // Get only the next 5 days

    return averagedDailyForecast;
  };

  return (
    <div className={(typeof weather.main != "undefined") ? ((weather.main.temp > 16) ? 'app warm' : 'app') : 'app'}>
      <main>
        <div className="search-box">
          <input
            type="text"
            className="search-bar"
            placeholder="Search Location"
            onChange={e => setQuery(e.target.value)}
            value={query}
            onKeyPress={search}
          />
        </div>

        {loading && <div className="loading-message">Loading weather data...</div>}
        {error && <div className="error-message">{error}</div>}

        {(typeof weather.main != "undefined" && !loading && !error) ? (
          <> {/* Use Fragment to group multiple top-level elements */}
            <div className="location-box">
              <div className="location">{weather.name}, {weather.sys.country}</div>
              <div className="date">{dateBuilder(new Date())}</div>
            </div>
            <div className="weather-box">
              <div className="temp">
                {Math.round(weather.main.temp)}°c
              </div>
              <div className="weather">{weather.weather[0].main}</div>
              <div className="details-row">
                <div className="detail-item">
                  <span className="label">Humidity:</span> {weather.main.humidity}%
                </div>
                <div className="detail-item">
                  <span className="label">Wind:</span> {Math.round(weather.wind.speed)} m/s
                </div>
              </div>
              <div className="detail-item">
                  <span className="label">Description:</span> {weather.weather[0].description}
              </div>
            </div>

            {/* 5-Day Forecast Section */}
            {forecast.length > 0 && (
              <div className="forecast-container">
                <h3 className="forecast-title">5-Day Forecast</h3>
                <div className="forecast-grid">
                  {forecast.map((day, index) => (
                    <div key={index} className="forecast-day-card">
                      <div className="forecast-date">{day.date}</div>
                      <img
                        src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`}
                        alt={day.description}
                        className="forecast-icon"
                      />
                      <div className="forecast-temp">{day.temp}°c</div>
                      <div className="forecast-description">{day.description}</div>
                      <div className="forecast-detail">Humidity: {day.humidity}%</div>
                      <div className="forecast-detail">Wind: {day.wind_speed} m/s</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : ('')}
      </main>
    </div>
  );
}

export default App;