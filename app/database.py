# Purpose: Manages data storage using pandas and storing data in a CSV file. 
# Interacts with: main.py, data_processing.py, and possibly models.py.
# Programming Language: Python (pandas library).

import pandas as pd
import os

# Define the path for the CSV file
CSV_FILE_PATH = 'field_data.csv'

# Function to initialize the data storage (create a new CSV file if it doesn't exist)
def init_db():
    # Check if the CSV file exists
    if not os.path.exists(CSV_FILE_PATH):
        # Define the initial structure of the CSV file
        df = pd.DataFrame(columns=[
            'Prospect ID', 'address', 'timestamp', 'prospect_response', 'reason_of_no',
            'electricity_bill_estimate', 'approximate_age', 'presumed_gender',
            'presumed_family_status', 'solar_panels_on_roof', 'house_characteristics',
            'interest_level', 'additional_notes', 'Submitted by'
        ])
        # Save the empty DataFrame to a CSV file
        df.to_csv(CSV_FILE_PATH, index=False)
        print(f"Initialized new database at {CSV_FILE_PATH}")

# Function to save new data into the CSV file
def save_data(data, role, nickname):
    # Load the existing data from the CSV file
    df = pd.read_csv(CSV_FILE_PATH)
    
    # Determine the next Prospect ID by finding the max ID and incrementing it
    if len(df) > 0:
        next_id = df['Prospect ID'].max() + 1
    else:
        next_id = 1
    # Assign the new Prospect ID to the data
    new_data=pd.DataFrame([data])
    new_data.insert(0, 'Prospect ID', next_id)
    new_data['Submitted by'] = f'{role} {nickname}'

    # Append the new data as a new row
    df = pd.concat([df,new_data], ignore_index=True)

    # Sort the DataFrame so that the most recent data (highest Prospect ID) is at the top
    df = df.sort_values(by='Prospect ID', ascending=False)

    # Save the updated DataFrame back to the CSV file
    df.to_csv(CSV_FILE_PATH, index=False)
    print("Data saved successfully.")

# Function to eliminate a specific row of data from the CSV file
def delete_data(prospect_id):
    # Load the existing data from the CSV file
    df = pd.read_csv(CSV_FILE_PATH)

    # Find and delete the row with the given Prospect ID
    df = df[df['Prospect ID'] != prospect_id]

    # Recalculate the Prospect IDs after deletion
    df = df.sort_values(by='Prospect ID', ascending=True).reset_index(drop=True)
    df['Prospect ID'] = range(1, len(df) + 1)

    # Sort by the updated Prospect IDs so that the most recent is on top
    df = df.sort_values(by='Prospect ID', ascending=False)

    # Save the updated DataFrame back to the CSV file
    df.to_csv(CSV_FILE_PATH, index=False)
    print("Data deleted successfully.")
    

# Function to load data from the CSV file
def load_data():
    # Check if the CSV file exists
    if os.path.exists(CSV_FILE_PATH):
        # Load and return the data as a DataFrame
        return pd.read_csv(CSV_FILE_PATH)
    else:
        print("No data found. Please initialize the database first.")
        return pd.DataFrame()
