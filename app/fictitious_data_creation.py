import pandas as pd
import numpy as np
from faker import Faker
import os
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get the MongoDB URI from environment variables
MONGO_URI = os.getenv('MONGO_URI')

# Create a MongoClient instance
client = MongoClient(MONGO_URI)

# Select the database and collection
db = client['solar_d2d_lead_generation_tracker']
collection = db['fictitious_data']

fake = Faker()

# Team members data
team_members_doors_per_day = {
    'Canvasser Gastani Frinzi': 80, 'Canvasser Leo Meo': 40,
    'Canvasser Elise Bonjour': 50, 'Team Leader Stephany Wellingthon': 70
}
team_members_skill_level = {
    'Canvasser Gastani Frinzi': 0.9, 'Canvasser Leo Meo': 1.1,
    'Canvasser Elise Bonjour': 1.0, 'Team Leader Stephany Wellingthon': 1.05
}

# General data
num_days = 30

# Generate data for each team member and each day
for day in range(num_days):
    for team_member, doors_per_day in team_members_doors_per_day.items():
        for _ in range(doors_per_day):
            prospect_response = np.random.choice(
                ['No answer', 'Not interested (Homeowner)', 'Not interested (Renter)', 'Request to Return later', 
                'Positive conversation (Initial)', 'Positive conversation (Detailed)', 'Appointment set', 'Undefined'],
                1,
                p=[0.496, 0.243, 0.142, 0.028, 0.049-0.002*team_members_skill_level[team_member], 0.02, 0.013, 0.009+0.002*team_members_skill_level[team_member]]
            )[0]

            record = {
                'address': fake.address(),
                'timestamp': fake.date_time_between(start_date='-30d', end_date='now'),
                'prospect_response': prospect_response,
                'name_surname': fake.name() if prospect_response == 'Appointment set' else 'n/a',
                'contact_email': fake.email() if prospect_response == 'Appointment set' else 'n/a',
                'contact_phone': fake.phone_number() if prospect_response == 'Appointment set' else 'n/a',
                'appointment_time': fake.date_time_between(start_date='now', end_date='+30d') if prospect_response == 'Appointment set' else 'n/a',
                'reason_of_no': np.random.choice(
                    ['Reason not provided', 'Already got solar panels on rooftop', 'Does not make economical sense', 'Electricity bill is already low', 
                    'Busy at the moment / other priorities', 'Too old', 'Rooftop to renovate first', 'Does not trust door knocking people',
                    'Soon moving out / selling the house', 'Already agreed with competitor', 'Too much shading', 'Other (explain in Comments)'],
                    1,
                    p=[0.626, 0.123, 0.07, 0.043, 0.041, 0.022, 0.014, 0.008, 0.017, 0.014, 0.002, 0.02]
                )[0] if prospect_response not in ['No answer', 'Appointment set'] else 'n/a',
                'solar_panels_on_roof': np.random.choice(
                    ['Yes, new PV (less than 5 years old)', 'Yes, old PV (more than 5 years old)', 'Yes, thermal panels', 'No', 'Unknown'], 1, 
                    p=[0.2, 0.4, 0.05, 0.25, 0.1])[0],
                'roof_type_condition': np.random.choice(
                    ['Flat, in good conditions', 'Flat, needs repair', 'Pitched, in good conditions', 'Pitched, needs repair', 'Other (specify in Comments)'], 1, p=[0.2, 0.1, 0.5, 0.1, 0.1])[0],
                'shading_issues': np.random.choice(
                    ['None', 'Partial', 'Significant', 'Unknown'], 1, p=[0.2, 0.3, 0.3, 0.2])[0],
                'appliances': np.random.choice(
                    ['Swimming pool', 'Air conditioning', 'Electrical Vehicle(s)', 'Large garden', 'Other (specify in Comments)'], 1, p=[0.2, 0.2, 0.2, 0.2, 0.2])[0],
                'electricity_bill_estimate': np.random.randint(50, 800) if prospect_response != 'No answer' else None,
                'number_of_decision_makers': np.random.choice(['One', 'Two', 'Multiple', 'Unknown'], 1, p=[0.25, 0.25, 0.25, 0.25])[0] if prospect_response != 'No answer' else None,
                'approximate_age': np.random.choice(['18-30', '31-45', '46-60', '61-80', '81+', 'Unknown'], 1, p=[0.2, 0.2, 0.2, 0.2, 0.1, 0.1])[0] if prospect_response != 'No answer' else None,
                'number_inhabitants': np.random.choice(['1', '2', '3-4', '5+', 'Unknown'], 1, p=[0.2, 0.2, 0.2, 0.2, 0.2])[0] if prospect_response != 'No answer' else None,
                'additional_notes': "I'm a fake data sample bro",
                'Submitted by': team_member
            }
            result = collection.insert_one(record)
            print(f"Data saved successfully with ID: {result.inserted_id}")




