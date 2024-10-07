from ML_model import SolarLeadPredictor
from database import load_data
import pandas as pd

def prepare_data():
    data = load_data()
    df = pd.DataFrame(data)
    return df

def train_and_save_model():
    predictor = SolarLeadPredictor()
    data = prepare_data()
    predictor.train(data)
    predictor.save_model('solar_lead_predictor.joblib')
    print("Model trained and saved successfully.")

if __name__ == "__main__":
    train_and_save_model()