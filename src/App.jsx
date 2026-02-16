import React, { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, Search, MapPin, Navigation, AlertTriangle, Activity, Shirt, Plus, X, Heart } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WeatherApp = () => {
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');
  const [darkMode, setDarkMode] = useState(true);
  const [isCelsius, setIsCelsius] = useState(true);
  const [error, setError] = useState('');
  const [savedLocations, setSavedLocations] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [showAddLocation, setShowAddLocation] = useState(false);

  const API_KEY = '39b659e45eb2515897910407075dcfab';

  useEffect(() => {
    // Load saved locations from localStorage
    const saved = localStorage.getItem('savedLocations');
    if (saved) {
      setSavedLocations(JSON.parse(saved));
    }
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
          fetchWeatherByCity('Abuja');
        }
      );
    } else {
      fetchWeatherByCity('Abuja');
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    setLoading(true);
    setError('');
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
      );
      const aqiRes = await fetch(
        `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
      );
      
      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();
      const aqiData = await aqiRes.json();
      
      setWeather(weatherData);
      setForecast(forecastData);
      setAirQuality(aqiData.list[0]);
    } catch (err) {
      setError('Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const fetchWeatherByCity = async (city) => {
    setLoading(true);
    setError('');
    try {
      const weatherRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
      );
      const forecastRes = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
      );
      
      if (!weatherRes.ok) {
        throw new Error('City not found');
      }
      
      const weatherData = await weatherRes.json();
      const forecastData = await forecastRes.json();
      
      // Fetch air quality using coordinates from weather data
      const aqiRes = await fetch(
        `http://api.openweathermap.org/data/2.5/air_pollution?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&appid=${API_KEY}`
      );
      const aqiData = await aqiRes.json();
      
      setWeather(weatherData);
      setForecast(forecastData);
      setAirQuality(aqiData.list[0]);
    } catch (err) {
      setError('City not found. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchCity.trim()) {
      fetchWeatherByCity(searchCity);
      setSearchCity('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const addToSavedLocations = () => {
    if (weather && !savedLocations.find(loc => loc.name === weather.name)) {
      const newLocation = {
        name: weather.name,
        country: weather.sys.country,
        lat: weather.coord.lat,
        lon: weather.coord.lon
      };
      const updated = [...savedLocations, newLocation];
      setSavedLocations(updated);
      localStorage.setItem('savedLocations', JSON.stringify(updated));
    }
  };

  const removeFromSavedLocations = (index) => {
    const updated = savedLocations.filter((_, i) => i !== index);
    setSavedLocations(updated);
    localStorage.setItem('savedLocations', JSON.stringify(updated));
  };

  const loadSavedLocation = (location) => {
    fetchWeatherByCoords(location.lat, location.lon);
  };

  const convertTemp = (temp) => {
    if (isCelsius) return Math.round(temp);
    return Math.round((temp * 9/5) + 32);
  };

  const getWeatherGradient = (condition) => {
    if (!condition) return 'from-blue-900 via-blue-800 to-blue-900';
    
    const main = condition.toLowerCase();
    if (main.includes('clear')) return 'from-orange-400 via-yellow-400 to-amber-500';
    if (main.includes('cloud')) return 'from-gray-600 via-gray-500 to-gray-600';
    if (main.includes('rain') || main.includes('drizzle')) return 'from-blue-700 via-blue-600 to-indigo-700';
    if (main.includes('snow')) return 'from-blue-200 via-blue-100 to-gray-200';
    if (main.includes('thunder')) return 'from-gray-800 via-purple-900 to-gray-900';
    if (main.includes('mist') || main.includes('fog')) return 'from-gray-500 via-gray-400 to-gray-500';
    return 'from-blue-900 via-blue-800 to-blue-900';
  };

  // Generate weather alerts based on conditions
  const generateAlerts = (weather) => {
    if (!weather) return [];
    
    const alerts = [];
    const temp = weather.main.temp;
    const windSpeed = weather.wind.speed;
    const condition = weather.weather[0].main.toLowerCase();
    
    if (temp > 38) {
      alerts.push({
        event: 'Extreme Heat Warning',
        description: 'Dangerously high temperatures expected. Stay hydrated and avoid prolonged outdoor exposure.'
      });
    } else if (temp < 0) {
      alerts.push({
        event: 'Freeze Warning',
        description: 'Freezing temperatures expected. Protect sensitive plants and pets.'
      });
    }
    
    if (windSpeed > 15) {
      alerts.push({
        event: 'High Wind Advisory',
        description: 'Strong winds may cause property damage and hazardous travel conditions.'
      });
    }
    
    if (condition.includes('thunder') || condition.includes('storm')) {
      alerts.push({
        event: 'Thunderstorm Warning',
        description: 'Severe thunderstorms in the area. Seek shelter and avoid outdoor activities.'
      });
    }
    
    return alerts;
  };

  // Calculate UV index (approximation based on cloud cover and time)
  const calculateUVIndex = (weather) => {
    if (!weather) return 5;
    
    const hour = new Date().getHours();
    const cloudiness = weather.clouds?.all || 0;
    
    let baseUV = 0;
    if (hour >= 10 && hour <= 16) {
      baseUV = 8;
    } else if (hour >= 8 && hour < 10 || hour > 16 && hour <= 18) {
      baseUV = 5;
    } else {
      baseUV = 2;
    }
    
    const uvReduction = (cloudiness / 100) * 0.7;
    return Math.round(baseUV * (1 - uvReduction));
  };

  const getUVLevel = (uvi) => {
    if (uvi <= 2) return { level: 'Low', color: 'bg-green-500', advice: 'No protection needed' };
    if (uvi <= 5) return { level: 'Moderate', color: 'bg-yellow-500', advice: 'Wear sunscreen' };
    if (uvi <= 7) return { level: 'High', color: 'bg-orange-500', advice: 'Protection essential' };
    if (uvi <= 10) return { level: 'Very High', color: 'bg-red-500', advice: 'Extra protection required' };
    return { level: 'Extreme', color: 'bg-purple-500', advice: 'Avoid sun exposure' };
  };

  const getAQILevel = (aqi) => {
    const levels = ['Good', 'Fair', 'Moderate', 'Poor', 'Very Poor'];
    const colors = ['bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500', 'bg-purple-500'];
    return { level: levels[aqi - 1], color: colors[aqi - 1] };
  };

  // Activity suggestions based on weather
  const getActivitySuggestions = (weather) => {
    if (!weather) return [];
    
    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase();
    const windSpeed = weather.wind.speed;
    const suggestions = [];

    if (condition === 'clear' && temp > 20 && temp < 30) {
      suggestions.push({ icon: '🏃', text: 'Perfect day for outdoor exercise' });
      suggestions.push({ icon: '🧺', text: 'Great weather for a picnic' });
    }
    
    if (condition.includes('rain')) {
      suggestions.push({ icon: '☔', text: 'Bring an umbrella' });
      suggestions.push({ icon: '📚', text: 'Good day for indoor activities' });
      suggestions.push({ icon: '🎬', text: 'Perfect movie day' });
    }
    
    if (temp < 15) {
      suggestions.push({ icon: '☕', text: 'Perfect weather for hot drinks' });
      suggestions.push({ icon: '🍲', text: 'Great day for soup' });
    }
    
    if (windSpeed > 8 && windSpeed < 15) {
      suggestions.push({ icon: '🪁', text: 'Great conditions for kite flying' });
    }
    
    if (condition === 'clear' && temp > 25) {
      suggestions.push({ icon: '🏊', text: 'Perfect swimming weather' });
      suggestions.push({ icon: '🍦', text: 'Ice cream weather!' });
    }
    
    if (condition === 'snow') {
      suggestions.push({ icon: '⛷️', text: 'Skiing conditions' });
      suggestions.push({ icon: '☃️', text: 'Build a snowman!' });
    }

    if (suggestions.length === 0) {
      suggestions.push({ icon: '🚶', text: 'Nice day for a walk' });
    }

    return suggestions;
  };

  // Outfit recommendations
  const getOutfitRecommendation = (weather) => {
    if (!weather) return [];
    
    const temp = weather.main.temp;
    const condition = weather.weather[0].main.toLowerCase();
    const outfit = [];

    if (temp < 5) {
      outfit.push('🧥 Heavy winter coat');
      outfit.push('🧣 Scarf and beanie');
      outfit.push('🧤 Insulated gloves');
    } else if (temp < 15) {
      outfit.push('🧥 Light jacket or sweater');
      outfit.push('👖 Long pants');
    } else if (temp < 20) {
      outfit.push('👕 Long sleeve shirt');
      outfit.push('👖 Comfortable pants');
    } else if (temp < 28) {
      outfit.push('👕 T-shirt or light top');
      outfit.push('👖 Jeans or casual pants');
    } else {
      outfit.push('👕 Light, breathable clothing');
      outfit.push('🩳 Shorts recommended');
    }

    if (condition.includes('rain')) {
      outfit.push('☔ Umbrella (essential!)');
      outfit.push('👢 Waterproof footwear');
    }

    if (condition === 'clear' && temp > 22) {
      outfit.push('🕶️ Sunglasses');
      outfit.push('🧢 Hat for sun protection');
    }
    
    if (condition.includes('snow')) {
      outfit.push('🧤 Waterproof gloves');
      outfit.push('🥾 Snow boots');
    }

    return outfit;
  };

  const AnimatedWeatherIcon = ({ condition }) => {
    if (!condition) return <Cloud className="w-16 h-16" />;
    
    const main = condition.toLowerCase();
    
    if (main.includes('clear')) {
      return (
        <div className="relative w-16 h-16">
          <Sun className="w-16 h-16 text-yellow-300 animate-spin" style={{ animationDuration: '20s' }} />
        </div>
      );
    }
    
    if (main.includes('rain')) {
      return (
        <div className="relative w-16 h-16">
          <CloudRain className="w-16 h-16 text-blue-300 animate-bounce" style={{ animationDuration: '2s' }} />
        </div>
      );
    }
    
    if (main.includes('cloud')) {
      return (
        <div className="relative w-16 h-16">
          <Cloud className="w-16 h-16 text-gray-300 animate-pulse" />
        </div>
      );
    }
    
    return <Cloud className="w-16 h-16" />;
  };

  const getDailyForecast = () => {
    if (!forecast) return [];
    
    const daily = {};
    forecast.list.forEach(item => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!daily[date]) {
        daily[date] = item;
      }
    });
    
    return Object.values(daily).slice(0, 7);
  };

  const getHourlyForecast = () => {
    if (!forecast) return [];
    return forecast.list.slice(0, 8);
  };

  const getTemperatureChartData = () => {
    if (!forecast) return [];
    return forecast.list.slice(0, 8).map(item => ({
      time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
      temp: convertTemp(item.main.temp),
      feelsLike: convertTemp(item.main.feels_like)
    }));
  };

  const getPrecipitationChartData = () => {
    if (!forecast) return [];
    return forecast.list.slice(0, 8).map(item => ({
      time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' }),
      precipitation: item.pop * 100
    }));
  };

  const WindCompass = ({ degrees, speed }) => {
    return (
      <div className="relative w-48 h-48 mx-auto">
        {/* Outer Circle with Gradient */}
        <div className={`absolute inset-0 rounded-full border-8 ${
          darkMode ? 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900' : 'border-gray-300 bg-gradient-to-br from-blue-50 to-white'
        } shadow-lg`}>
          
          {/* Cardinal Direction Labels - Larger & More Visible */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
            <div className={`px-3 py-1 rounded-lg font-bold text-lg ${
              darkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
            }`}>N</div>
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className={`px-3 py-1 rounded-lg font-bold text-lg ${
              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-400 text-white'
            }`}>S</div>
          </div>
          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2">
            <div className={`px-3 py-1 rounded-lg font-bold text-lg ${
              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-400 text-white'
            }`}>W</div>
          </div>
          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
            <div className={`px-3 py-1 rounded-lg font-bold text-lg ${
              darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-400 text-white'
            }`}>E</div>
          </div>
          
          {/* Degree Markers */}
          <div className="absolute inset-2">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
              <div
                key={deg}
                className="absolute top-1/2 left-1/2 w-1 origin-left"
                style={{
                  height: deg % 90 === 0 ? '12px' : '8px',
                  transform: `rotate(${deg}deg) translateX(${deg % 90 === 0 ? '70px' : '75px'})`,
                  backgroundColor: darkMode ? '#4B5563' : '#D1D5DB'
                }}
              />
            ))}
          </div>
        </div>
        
        {/* Wind Direction Arrow - Much More Visible */}
        <div 
          className="absolute inset-0 flex items-center justify-center transition-transform duration-1000 ease-out"
          style={{ transform: `rotate(${degrees}deg)` }}
        >
          {/* Arrow Shaft */}
          <div className="relative w-2 h-20">
            <div className={`absolute inset-0 rounded-full ${
              darkMode ? 'bg-gradient-to-b from-red-500 to-blue-500' : 'bg-gradient-to-b from-red-600 to-blue-600'
            } shadow-lg`}></div>
          </div>
          
          {/* Arrow Head */}
          <div 
            className="absolute top-8" 
            style={{
              width: 0,
              height: 0,
              borderLeft: '12px solid transparent',
              borderRight: '12px solid transparent',
              borderBottom: darkMode ? '20px solid #EF4444' : '20px solid #DC2626',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          ></div>
          
          {/* Arrow Tail */}
          <div 
            className="absolute bottom-8" 
            style={{
              width: 0,
              height: 0,
              borderLeft: '8px solid transparent',
              borderRight: '8px solid transparent',
              borderTop: darkMode ? '12px solid #3B82F6' : '12px solid #2563EB',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
            }}
          ></div>
        </div>
        
        {/* Center Circle with Speed */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${
            darkMode ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-white to-gray-100'
          } rounded-full w-16 h-16 flex items-center justify-center border-4 ${
            darkMode ? 'border-gray-600' : 'border-gray-300'
          } shadow-xl`}>
            <div className="text-center">
              <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {speed}
              </p>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                m/s
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SunriseSunset = ({ sunrise, sunset, timezone }) => {
    const now = Date.now() / 1000;
    const sunriseTime = sunrise + timezone;
    const sunsetTime = sunset + timezone;
    const totalDaylight = sunsetTime - sunriseTime;
    const elapsed = now - sunriseTime;
    const progress = Math.max(0, Math.min(100, (elapsed / totalDaylight) * 100));
    
    const formatTime = (timestamp) => {
      return new Date(timestamp * 1000).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };
    
    return (
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
        <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Sun Position
        </h3>
        
        <div className="relative h-24 mb-4">
          <svg viewBox="0 0 200 100" className="w-full h-full">
            <path
              d="M 10 90 Q 100 10 190 90"
              fill="none"
              stroke={darkMode ? '#374151' : '#E5E7EB'}
              strokeWidth="4"
            />
            <path
              d="M 10 90 Q 100 10 190 90"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="4"
              strokeDasharray="280"
              strokeDashoffset={280 - (280 * progress / 100)}
              className="transition-all duration-1000"
            />
            <circle
              cx={10 + (180 * progress / 100)}
              cy={90 - Math.sin((progress / 100) * Math.PI) * 80}
              r="8"
              fill="#FCD34D"
              className="transition-all duration-1000"
            />
          </svg>
        </div>
        
        <div className="flex justify-between items-center">
          <div className="text-center">
            <Sun className={`w-6 h-6 mx-auto mb-1 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`} />
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sunrise</p>
            <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {formatTime(sunriseTime)}
            </p>
          </div>
          <div className="text-center">
            <Sun className={`w-6 h-6 mx-auto mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-500'}`} />
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sunset</p>
            <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {formatTime(sunsetTime)}
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={darkMode ? 'text-white' : 'text-gray-800'}>Loading weather data...</p>
        </div>
      </div>
    );
  }

  const bgGradient = weather ? getWeatherGradient(weather.weather[0].main) : 'from-blue-900 via-blue-800 to-blue-900';
  const alerts = generateAlerts(weather);
  const uvIndex = calculateUVIndex(weather);
  const uvInfo = getUVLevel(uvIndex);
  const aqiInfo = airQuality ? getAQILevel(airQuality.main.aqi) : null;
  const activities = getActivitySuggestions(weather);
  const outfit = getOutfitRecommendation(weather);
  const isLocationSaved = weather && savedLocations.find(loc => loc.name === weather.name);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sun className={`w-8 h-8 ${darkMode ? 'text-yellow-400' : 'text-orange-500'}`} />
              <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>SkyCast</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsCelsius(!isCelsius)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                °{isCelsius ? 'C' : 'F'}
              </button>
              
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  darkMode ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
              
              <button
                onClick={getCurrentLocation}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                <MapPin className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
              </button>

              {weather && (
                <button
                  onClick={addToSavedLocations}
                  disabled={isLocationSaved}
                  className={`p-2 rounded-lg transition-colors ${
                    isLocationSaved 
                      ? darkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'
                      : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title={isLocationSaved ? 'Saved' : 'Save location'}
                >
                  <Heart className={`w-5 h-5 ${isLocationSaved ? 'fill-current text-white' : darkMode ? 'text-white' : 'text-gray-800'}`} />
                </button>
              )}
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <input
                type="text"
                value={searchCity}
                onChange={(e) => setSearchCity(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for a city..."
                className={`w-full pl-10 pr-4 py-3 rounded-lg outline-none transition-colors ${
                  darkMode ? 'bg-gray-700 text-white placeholder-gray-400' : 'bg-gray-100 text-gray-800 placeholder-gray-500'
                }`}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Search
            </button>
          </div>
          
          {error && (
            <p className="mt-2 text-red-500 text-sm">{error}</p>
          )}

          {/* Saved Locations */}
          {savedLocations.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Saved Locations
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {savedLocations.map((location, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      darkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}
                  >
                    <button
                      onClick={() => loadSavedLocation(location)}
                      className={`text-sm ${darkMode ? 'text-white hover:text-blue-400' : 'text-gray-800 hover:text-blue-600'} transition-colors`}
                    >
                      {location.name}, {location.country}
                    </button>
                    <button
                      onClick={() => removeFromSavedLocations(index)}
                      className={`${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'}`}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {weather && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Weather Alerts */}
          {alerts.length > 0 && (
            <div className="bg-red-500/90 backdrop-blur-md rounded-2xl p-6 mb-8 shadow-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-white mt-1" size={24} />
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl mb-3">⚠️ Weather Alerts</h3>
                  {alerts.map((alert, index) => (
                    <div key={index} className="text-white mb-3 last:mb-0">
                      <p className="font-semibold text-lg">{alert.event}</p>
                      <p className="text-sm text-white/90">{alert.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className={`bg-gradient-to-br ${bgGradient} rounded-3xl p-8 mb-8 shadow-2xl transition-all duration-500`}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-white text-4xl font-bold mb-2">{weather.name}, {weather.sys.country}</h2>
                <p className="text-white/80 text-lg">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <AnimatedWeatherIcon condition={weather.weather[0].main} />
            </div>
            
            <div className="mt-8 flex items-end gap-4">
              <div className="text-8xl font-bold text-white">
                {convertTemp(weather.main.temp)}°
              </div>
              <div className="pb-4">
                <p className="text-white/90 text-2xl capitalize">{weather.weather[0].description}</p>
                <p className="text-white/70 text-lg">Feels like {convertTemp(weather.main.feels_like)}°</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-2">
                <Wind className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wind</span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {weather.wind.speed} m/s
              </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-2">
                <Droplets className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Humidity</span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {weather.main.humidity}%
              </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-2">
                <Eye className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Visibility</span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {(weather.visibility / 1000).toFixed(1)} km
              </p>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-2">
                <Gauge className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pressure</span>
              </div>
              <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {weather.main.pressure} hPa
              </p>
            </div>
          </div>

          {/* Air Quality and UV Index */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {aqiInfo && (
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
                <div className="flex items-center gap-3 mb-4">
                  <Wind className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Air Quality</h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`w-20 h-20 ${aqiInfo.color} rounded-full flex items-center justify-center`}>
                    <span className="text-2xl font-bold text-white">{airQuality.main.aqi}</span>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{aqiInfo.level}</p>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AQI Level</p>
                  </div>
                </div>
              </div>
            )}

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-4">
                <Sun className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-orange-500'}`} />
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>UV Index</h3>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 ${uvInfo.color} rounded-full flex items-center justify-center`}>
                  <span className="text-2xl font-bold text-white">{uvIndex}</span>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{uvInfo.level}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{uvInfo.advice}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Activity Suggestions and Outfit Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-4">
                <Activity className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Activity Suggestions</h3>
              </div>
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3 flex items-center gap-3`}>
                    <span className="text-2xl">{activity.icon}</span>
                    <p className={`${darkMode ? 'text-white' : 'text-gray-800'}`}>{activity.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <div className="flex items-center gap-3 mb-4">
                <Shirt className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>What to Wear</h3>
              </div>
              <div className="space-y-2">
                {outfit.map((item, index) => (
                  <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-3`}>
                    <p className={`text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Temperature Trend
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={getTemperatureChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="time" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      color: darkMode ? '#FFFFFF' : '#1F2937'
                    }}
                  />
                  <Line type="monotone" dataKey="temp" stroke="#3B82F6" strokeWidth={3} name="Temperature" />
                  <Line type="monotone" dataKey="feelsLike" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Feels Like" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Precipitation Probability
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={getPrecipitationChartData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="time" stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <YAxis stroke={darkMode ? '#9CA3AF' : '#6B7280'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: darkMode ? '#1F2937' : '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      color: darkMode ? '#FFFFFF' : '#1F2937'
                    }}
                  />
                  <Bar dataKey="precipitation" fill="#60A5FA" name="Chance %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
              <h3 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                Wind Direction
              </h3>
              <WindCompass degrees={weather.wind.deg} speed={weather.wind.speed} />
              <p className={`text-center mt-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {weather.wind.deg}° - {weather.wind.speed} m/s
              </p>
            </div>

            <SunriseSunset 
              sunrise={weather.sys.sunrise} 
              sunset={weather.sys.sunset} 
              timezone={weather.timezone}
            />
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 mb-8 shadow-lg`}>
            <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Hourly Forecast</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {getHourlyForecast().map((hour, index) => (
                <div key={index} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
                  <p className={`text-sm mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {new Date(hour.dt * 1000).toLocaleTimeString('en-US', { hour: 'numeric' })}
                  </p>
                  <Cloud className={`w-8 h-8 mx-auto mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {convertTemp(hour.main.temp)}°
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
            <h3 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-800'}`}>7-Day Forecast</h3>
            <div className="space-y-4">
              {getDailyForecast().map((day, index) => (
                <div key={index} className={`flex items-center justify-between ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-xl p-4`}>
                  <div className="flex items-center gap-4 flex-1">
                    <p className={`w-28 font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {index === 0 ? 'Today' : new Date(day.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <Cloud className={`w-8 h-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                    <p className={`flex-1 capitalize ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {day.weather[0].description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {convertTemp(day.main.temp_min)}°
                    </p>
                    <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {convertTemp(day.main.temp_max)}°
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;