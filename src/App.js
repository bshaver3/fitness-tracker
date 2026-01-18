import logo from './logo.svg';
import React, { useState, useEffect } from 'react';  // Bringing in tools to make our app interactive
import axios from 'axios';  // A helper to send messages to the backend
import './App.css';  // A file to make it look nice
import { Bar } from 'react-chartjs-2';  // A bar chart type
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';  // Chart pieces
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);  // Tell Chart.js to use these pieces

function App() {  // The main part of your app, like the control room
  const [workouts, setWorkouts] = useState([]);  // A box to hold all your workouts
  const [insights, setInsights] = useState(null);  // A box for cool facts (like total calories)
  const [formData, setFormData] = useState({ type: '', duration: '', calories: '' });  // A box for what the user types

  useEffect(() => {  // A robot that runs when the app starts
    fetchWorkouts();  // Go get the workouts
    fetchInsights();  // Go get the insights
  }, []);  // Empty "watch list" means it only runs once when the app loads

  const fetchWorkouts = () => {  // A little helper to grab workouts
    axios.get('https://7pybxmlcvh.execute-api.us-east-1.amazonaws.com/workouts')  // Ask the backend for the workout list
      .then(response => setWorkouts(response.data))  // Put the list in the workouts box
      .catch(error => console.error('Error fetching workouts:', error));  // Yell if something goes wrong
  };

  const fetchInsights = () => {  // A helper to grab insights
    axios.get('https://7pybxmlcvh.execute-api.us-east-1.amazonaws.com/insights')  // Ask the backend for insights
      .then(response => setInsights(response.data))  // Put the insights in the insights box
      .catch(error => console.error('Error fetching insights:', error));  // Yell if something’s off
  };

  const handleChange = (e) => {  // A helper to watch what the user types
    setFormData({ ...formData, [e.target.name]: e.target.value });  // Update the form box with new typing
  };

  const handleSubmit = (e) => {  // A helper for when the user clicks "Log Workout"
    e.preventDefault();  // Stop the page from refreshing (normal form behavior)
    axios.post('https://7pybxmlcvh.execute-api.us-east-1.amazonaws.com/workouts', {  // Send the workout to the backend
      type: formData.type,
      duration: parseInt(formData.duration),  // Turn text into a number
      calories: parseInt(formData.calories)  // Turn text into a number
    })
      .then(() => {  // If it works...
        setFormData({ type: '', duration: '', calories: '' });  // Clear the form box
        fetchWorkouts();  // Get the updated workout list
        fetchInsights();  // Get the updated insights
      })
      .catch(error => console.error('Error logging workout:', error));  // Yell if it fails
  };
  const chartData = {
    labels: workouts.map(w => w.type),  // X-axis: workout types like "Cardio"
    datasets: [{
      label: 'Calories Burned',  // What the bars represent
      data: workouts.map(w => w.calories),  // Y-axis: calories for each workout
      backgroundColor: 'rgba(75, 192, 192, 0.6)'  // Bar color (teal-ish)
    }]
  };

  return (  // The part that shows up on the screen
    <div className="App">  // A big container for everything, styled by App.css
      <h1>Fitness Tracker</h1>  // A big title
      <form onSubmit={handleSubmit}>  // A form where users type stuff
        <input  // A box for the workout type
          name="type"
          value={formData.type}  // Shows what’s in the form box
          onChange={handleChange}  // Updates the box when typing
          placeholder="Workout Type"  // Hint text when empty
        />
        <input  // A box for duration
          name="duration"
          type="number"  // Only allows numbers
          value={formData.duration}
          onChange={handleChange}
          placeholder="Duration (min)"
        />
        <input  // A box for calories
          name="calories"
          type="number"
          value={formData.calories}
          onChange={handleChange}
          placeholder="Calories"
        />
        <button type="submit">Log Workout</button>  // A button to send the form
      </form>
       <form onSubmit={handleSubmit}>  // A form where users type stuff
        <input  // A box for the workout type
          name="type"
          value={formData.type}  // Shows what’s in the form box
          onChange={handleChange}  // Updates the box when typing
          placeholder="Workout Name"  // Hint text when empty
        />
        <button type="submit">Delete Workout</button>  // A button to send the form
      </form>
      <h2>Your Workouts</h2>  // A title for the workout list
      <ul>  // A list to show workouts
        {workouts.map((w, idx) => (  // Loop through the workouts box
          <li key={idx}>{w.type} - {w.duration} min - {w.calories} cal</li>  // Show each workout
        ))}
      </ul>
      <h2>Insights</h2>  // A title for insights
      {insights && <p>{insights.message}</p>}  // Show the insight message if it exists
      <div style={{ width: '50%', margin: '0 auto' }}>  // A box to hold the chart, centered and half-width
        <Bar data={chartData} />  // The actual bar chart
      </div>
    </div>
  );
}

export default App;  // Send this app to be used by React