# Features
Here is a more detailed list of the core features that the software now has, which can be divided into:
- Data Collection
- Field Support
- Prospect Qualification
- Analytics

## Data Collection
The software has the ability to record information from door-to-door interactions collected by the canvassers.
The data collected is divided into Mandatory and Optional fields.

**Mandatory**
- Address
- Timestamp (time of contact)
- Prospect response: it represents the answer (if any) of the potential prospect. This data is subdivided into the following subcategories:
    - No answer
    - Direct no (Homeowner)
    - Direct no (Renters)
    - Return later
    - Initial conversations
    - Detailed conversations
    - Appointments set
    - Undefined
- Reason of 'no' (if any): if the prospects says no, it can be useful to understand why. Below are some of the main reasons collected:
    - Already got solar panels on rooftop
    - Does not make economical sense
    - Electricity bill is already low
    - Cannot get incentives from government
    - Busy at the moment
    - Too old
    - Very steep rooftop
    - Rooftop to renovate first
    - Does not trust door knocking people
    - Soon selling the house
    - ...

**Optional**
- Electricity bill estimate (if provided)
- Approximate age
- Number of decision makers
- Number of inhabitants
- Solar panels on roof (Y/N)
- Roof type and condition
- Shading issues
- House characteristics (e.g., with swimming pool, air conditioning, electric vehicle, large garden)
- Any additional notes / comments from the canvasser

## Field Support
The software supports the canvassers in the field thanks to the data collected. This support is mainly provided in terms of:
- An interactive map
- A table containing the addresses worth returning to (AI powered feature)
- Performance tracking
- A customizable pitch recap

**Interactive Canvassing Map**

This map shows the houses with different markers based on their status (e.g., appointment set, no answer, return later). The map uses Leaflet.js for rendering and includes features like clustering for better performance with large datasets.

**'Worth returning table'**

Table that collects the addresses with prospect responses 'No answer' or 'Request to Return later' that an ML model predicted to have high chanches of converting into a sale.

**Performance Tracking**

The software now provides both daily and overall performance metrics for canvassers, including:
- Doors knocked
- Appointments set
- Conversion rate
- Ranking among team members

**Customizable Pitch Recap**

Canvassers can view and edit a standardized pitch to help them in their interactions with potential customers.

## Prospect Qualification
This new feature helps team leaders and managers to better understand and qualify prospects. It includes:

**Prospect Personas**

A comparison between the characteristics of the 'Best Prospects' (those most likely to set appointments) and the 'Worst Prospects' (those most likely to decline).

**Data Distribution Visualization**

Interactive charts showing the distribution of various data points collected, helping to identify trends and patterns in prospect characteristics.

**Initiatives Tracker**

A system to create, track, and manage initiatives aimed at improving lead quality. Initiatives can be categorized as successful, current, or unsuccessful.

**Pie charts**

They represent the distribution of the prospect responses and the main reasons of no.

## Analytics
The software provides analytics of different types thanks to the collected data, including:

**Team Overview**

Provides key metrics such as:
- Number of team members
- Total doors knocked
- Total appointments set
- Average doors knocked per day per employee
- Average appointments set per day per employee
- Average conversion rate

**Team Performance Charts**

Interactive charts showing the team's performance over time, with options to view total or daily metrics for doors knocked, appointments set, and conversion rates.

# Software Structure

The software can be broken down into several key components that work together to collect, store, process, and visualize data. Here's an overview of the flow:

1. **Data Collection User Interface (UI)**: A web-based frontend interface where canvassers input data collected during door-to-door interactions.

2. **Data Storage System**: A backend component that securely stores the collected data using MongoDB.

3. **Field Support Tools**:
   - **Map Integration**: Uses Leaflet.js to display interactive maps with data points.
   - **Data Processing Module**: Python programs that analyze stored data to determine conversion probabilities, generate personas, and process data for various visualizations.

4. **Prospect Qualification Tools**:
   - **Persona Generation**: Analyzes data to create profiles of best and worst prospects.
   - **Data Distribution Visualization**: Uses Chart.js to create interactive charts of data distributions.
   - **Initiatives Tracker**: Allows creation and management of improvement initiatives.

5. **Analytics Dashboard**: A frontend component that visualizes team performance data and provides insights for managers.

6. **Machine Learning Model**: A predictive model that estimates the probability of setting an appointment for prospects who weren't available or requested to return later.

# Detailed Description of Flow of Data and Information 

Let's go through the data flow step-by-step, involving each element in the software structure:

## Data Collection from Canvassers (UI)

- **Process**: Canvassers use a web app to input data during door-to-door visits. The data includes both mandatory and optional fields.
- **Technologies Involved**: HTML, CSS, JavaScript for the frontend, Flask for the backend.
- **Example**: A canvasser inputs data about a visit, including address, prospect response, and optional details like roof condition or electricity bill estimate.

## Data Transmission to Storage (Backend API)

- **Process**: The data collected by the UI is sent to a Flask backend API, which then stores it in MongoDB.
- **Technologies Involved**: Flask for the API, MongoDB for storage.
- **Example**: The app sends a POST request to the API endpoint `/save_data`, which receives the data, processes it, and stores it in the MongoDB database.

## Data Storage and Management (Database)

- **Process**: The collected data is stored in a structured format within MongoDB.
- **Technologies Involved**: MongoDB
- **Example**: The database stores multiple records from different canvassers, allowing for later retrieval and analysis.

## Data Processing for Field Support and Analytics (Backend Python Programs)

- **Process**: Python scripts process the data to calculate performance metrics, generate personas, and prepare data for visualizations.
- **Technologies Involved**: Python (using libraries like pandas for data manipulation)
- **Example**: The `get_team_overview` function in data_processing.py calculates team performance metrics.

## Map Integration (Leaflet.js)

- **Process**: The processed data is used to create interactive maps showing the status of different addresses.
- **Technologies Involved**: Leaflet.js for frontend map rendering, Flask routes to serve map data.
- **Example**: The Field Support page displays a map with markers showing houses visited, color-coded by their status.

## Analytics and Reporting (Analytics Dashboard)

- **Process**: The processed data is visualized through dashboards that provide insights into team performance and prospect characteristics.
- **Technologies Involved**: Chart.js for interactive charts, Flask routes to serve data for charts.
- **Example**: The Analytics page displays charts showing team performance over time and provides a team overview.

## Machine Learning Model for Prediction

- **Process**: A machine learning model predicts the probability of setting an appointment for prospects who weren't available or requested to return later.
- **Technologies Involved**: Python (scikit-learn for model training and prediction)
- **Example**: The `SolarLeadPredictor` class in ML_model.py trains models and makes predictions based on prospect data.

# Example in Reality

Imagine a day in the life of a solar sales team using this software:

1. **Morning Briefing**: Team members log into the app to review their performance from the previous day and check the map for today's canvassing area.

2. **Canvassing**: Throughout the day, canvassers record each interaction in real-time using the data collection interface.

3. **Field Support**: Canvassers use the interactive map to navigate their assigned area efficiently. They can refer to the pitch recap for guidance during interactions.

4. **Data Processing and Analysis**: As data is collected, the backend continuously processes it, updating performance metrics and refining the machine learning model's predictions.

5. **Team Leader Review**: At the end of the day, team leaders use the Prospect Qualification page to analyze the day's data, identify trends, and plan strategies for improvement.

6. **Manager Overview**: Managers use the Analytics page to get a high-level view of the team's performance, identify top performers, and make data-driven decisions for the sales strategy.

This integrated approach allows for a continuous feedback loop, where data collected in the field immediately informs strategy and supports decision-making at all levels of the organization.