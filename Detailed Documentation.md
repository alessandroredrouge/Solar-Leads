# Features
Here is a more detailed list of the core features that the software will have, which can be divided in:
- Data Collection
- Field Support
- Analytics

## Data Collection
The software will have the ability to record information from door-to-door interactions collected by the canvassers.
The initial data that will be collected will be divided in Mandatory and Optional.

**Mandatory**
- Address
- Timestamp (time of contact)
- Prospect response: it represents the answer (if any) of the potential prospect. This data is subdivided in the following subcategories:
    - No answer
    - Direct no (Homeowner)
    - Direct no (Renters)
    - Return later
    - Initial conversations
    - Detailed conversations
    - Appointments set
    - Undefined
- Reason of 'no' (if any): if the prospects says no, it can be useful to understand why. Below are some of the main reasons collected so far, that would be useful to keep track of to eventually adapt the offer:
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
- Presumed gender
- Presumed family status (single, married,...)
- Solar panels on roof (Y/N)
- House characteristics (e.g., with swimming pool, sunny area, partial shadowing from trees)
- Interest level
- Any additional notes / comments from the canvasser

## Field Support
The software will support the canvassers on the field thanks to the data collected. This support will be mainly provided in terms of:
- a map
- a route suggestion. 

**Optimized Canvassing Map**

This map shows the houses highlighted in different gradient of colors, from red (low probability of conversion) to green (high probability of conversion) based on how probable the software estimates that they would set up an appointment based on the data collected.

**Optimal Canvassing Route**

By having a map that determines the probability of conversion for each address (at least the ones for which data have been collected), the software also proposes a potential route for the canvasser to follow, in order to optimize its path on that workday and enhance the chances of setting up an appointment. This route basically connects the best houses evaluated in the previous step, including considerations of the time required to go from house to house by foot.

## Analytics
The software provides analytics of different types thanks to the collected data, from identifying the customer persona to tracking performances of the canvassers, estimating the efficacy of a specific sales pitch, identifying the best areas to canvass and so on...

# High-Level Description of Data and Information Flow

The software can be broken down into several key components that work together to collect, store, process, and visualize data. Here's an overview of the flow:

1. **User Interface (UI) for Data Collection**: A frontend interface (could be a web app or mobile app) where canvassers input data collected during door-to-door interactions.

2. **Data Storage System**: A backend component that securely stores the collected data. This could be a simple database like SQLite or a cloud-based database for scalability.

3. **Field Support Tools**:
   - **Google Maps Integration**: Uses Google Maps API to display maps and suggest optimized canvassing routes. The UI interacts with this component to display maps and routes.
   - **Data Processing Module**: A Python program that analyzes stored data to determine conversion probabilities and optimize canvassing routes.

4. **Analytics Dashboard**: A frontend component that visualizes data analytics for team leaders and canvassers to assess performance, understand customer personas, and identify effective canvassing strategies.

5. **Feedback Loop for Continuous Improvement**: A system that allows user input and feedback to refine algorithms and improve data accuracy and efficiency over time.

# Detailed Flow of Data and Information Through the Software

Let's go through the data flow step-by-step, involving each element in your software structure:

## Data Collection from Canvassers (UI)

- **Process**: Canvassers use a mobile or web app to input data during door-to-door visits. The data includes both mandatory and optional fields, such as the address, timestamp, homeowner response, and other details.
- **Technologies Involved**: Frontend technologies like HTML, CSS, and JavaScript (for a web app) or React Native/Flutter (for a mobile app). Python may be used on the backend for data handling.
- **Example**: A canvasser knocks on a door and gets a direct "no" from a renter. They enter the address, timestamp, prospect response ("Direct no (Renters)"), and optional notes into the app.

## Data Transmission to Storage (Backend API)

- **Process**: The data collected by the UI is sent to a backend API. The API is responsible for validating the input data, formatting it correctly, and storing it in a database.
- **Technologies Involved**: Python (Flask or Django) for the API, SQL/SQLite or a cloud-based database (like PostgreSQL or MongoDB) for storage.
- **Example**: The app sends a POST request to the API endpoint `/collect_data`, which receives the data, validates it, and stores it in the `leads` table of a SQLite database.

## Data Storage and Management (Database)

- **Process**: The collected data is stored in a structured format within the database. This storage system needs to efficiently handle CRUD (Create, Read, Update, Delete) operations.
- **Technologies Involved**: SQLite or another SQL-based database for the initial MVP. For more advanced versions, cloud databases (e.g., Firebase, AWS RDS) could be used.
- **Example**: The database stores multiple records from different canvassers, allowing for later retrieval and analysis.

## Data Processing for Field Support (Backend Python Program)

- **Process**: A Python script or backend service regularly processes the data to calculate conversion probabilities and generate optimized canvassing routes based on historical data and user feedback.
- **Technologies Involved**: Python (using libraries like `pandas` for data manipulation and `scikit-learn` for any basic predictive modeling, if required).
- **Example**: The script fetches all records from the last three months and uses the responses to calculate the likelihood of conversion for each address. It then outputs a list of addresses ranked by conversion probability.

## Google Maps Integration (Maps API)

- **Process**: The processed data is sent to the Google Maps API to display maps and suggest optimized routes based on conversion probability. The UI then displays this map to the canvasser.
- **Technologies Involved**: Google Maps JavaScript API for frontend map rendering, Python `requests` library to interact with Google Maps API on the backend if needed.
- **Example**: The app displays a map with markers showing houses in different colors based on their conversion probability. A route is suggested that minimizes walking time while maximizing contact with high-probability houses.

## Analytics and Reporting (Analytics Dashboard)

- **Process**: The data collected and processed is visualized through dashboards that provide insights into canvasser performance, customer personas, and effective canvassing strategies.
- **Technologies Involved**: Python (using libraries like `matplotlib` or `seaborn` for visualization), JavaScript frameworks like React or Vue.js for interactive dashboards.
- **Example**: A dashboard displays graphs showing the number of appointments set by each canvasser over time, identifying top performers and areas needing improvement.

## Feedback Loop for Continuous Improvement

- **Process**: The software collects feedback from users (canvassers and managers) about the accuracy and effectiveness of the predictions and route suggestions. This feedback is used to refine the data processing algorithms and improve system performance over time.
- **Technologies Involved**: Python for backend adjustments and improvements, database updates for tracking changes.
- **Example**: Canvassers note that certain "high-probability" houses are repeatedly uninterested. This feedback prompts an algorithm adjustment to weigh certain data points differently.

# Example in Reality

Imagine a day in the life of a canvasser using this software:

1. **Morning Briefing**: The canvasser logs into the app to see their assigned route for the day. The route is optimized based on conversion probabilities calculated from historical data.

2. **Canvassing**: At each house, the canvasser records the interaction in real-time using the app. If the prospect is uninterested, they select the appropriate reason for the "no" and add any additional notes.

3. **Data Processing and Analysis**: As the day progresses, the backend system collects all entries and processes them in real-time. The Python program updates the probability calculations based on new data points and feeds this information back into the route optimization tool.

4. **End of Day Reporting**: After canvassing, the canvasser reviews a summary of their day's performance on the analytics dashboard. The team leader uses the aggregated data to assess the effectiveness of current strategies and plan future efforts.

