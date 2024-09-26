# Purpose: Manages data storage using pandas and storing data on MongoDB. 
# Interacts with: main.py, data_processing.py.
# Programming Language: Python

import os
from pymongo import MongoClient
from dotenv import load_dotenv
from bson.objectid import ObjectId

# Load environment variables from .env file
load_dotenv()

# Get the MongoDB URI from environment variables
MONGO_URI = os.getenv('MONGO_URI')

# Create a MongoClient instance
client = MongoClient(MONGO_URI)

# Select the database and collection
db = client['solar_d2d_lead_generation_tracker']
collection = db['prospects'] 

def save_data(data, role, nickname):
    # Assign the 'Submitted by' field
    data['Submitted by'] = f'{role} {nickname}'
    
    # Insert the data into the MongoDB collection
    result = collection.insert_one(data)
    
    print(f"Data saved successfully with ID: {result.inserted_id}")

# Function to eliminate a specific row of data from the MongoDB database
def delete_data(prospect_id):
    try:
        prospect_id = ObjectId(prospect_id)
    except Exception as e:
        print(f"Invalid Prospect ID: {prospect_id}. Error: {e}")
        return False

    result = collection.delete_one({'_id': prospect_id})
    if result.deleted_count > 0:
        print(f"Data with Prospect ID {prospect_id} deleted successfully.")
        return True
    else:
        print(f"No data found with Prospect ID {prospect_id}.")
        return False

# Function to eliminate ALL data from the MongoDB database
def delete_ALL_data():
    result = collection.delete_many({})
    print(f"All data deleted successfully. Documents deleted: {result.deleted_count}")

# Function to load data from the MongoDB database
def load_data():
    # Retrieve all documents from the MongoDB collection
    data = list(collection.find().sort('_id', -1))
    return data
