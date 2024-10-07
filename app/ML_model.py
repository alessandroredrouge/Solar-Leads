import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
import joblib
from database import load_data

class SolarLeadPredictor:
    def __init__(self):
        self.model_no_answer = None
        self.model_return_later = None
        self.preprocessor_no_answer = None
        self.preprocessor_return_later = None
        self.smote = SMOTE(random_state=42)
        self.features_no_answer = ['solar_panels_on_roof', 'roof_type_condition', 'shading_issues', 'appliances']
        self.features_return_later = self.features_no_answer + ['electricity_bill_estimate', 'number_of_decision_makers', 'approximate_age', 'number_inhabitants']
    
    
    def create_preprocessor(self, features):
        categorical_features = ['solar_panels_on_roof', 'roof_type_condition', 'shading_issues', 'number_of_decision_makers', 'approximate_age', 'number_inhabitants']
        categorical_features = [f for f in categorical_features if f in features]
        numeric_features = ['electricity_bill_estimate'] if 'electricity_bill_estimate' in features else []

        categorical_transformer = OneHotEncoder(handle_unknown='ignore', sparse=False)
        numeric_transformer = StandardScaler()

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ])

        return preprocessor
    
    # FIXME: how to handle the appliances feature, which has multiple entries? ensure that this is handled properly
    def preprocess_appliances(self, data):
        appliances = ['Swimming pool', 'Air Conditioning', 'Electrical Vehicle(s)', 'Large garden', 'Other (specify in Comments)']
        
        # Ensure 'appliances' column exists, if not create it with empty strings
        if 'appliances' not in data.columns:
            data['appliances'] = ''
        
        # Handle NaN values
        data['appliances'] = data['appliances'].fillna('')
        
        for appliance in appliances:
            # Use ' - ' as the separator, and check for exact matches
            data[f'has_{appliance.lower().replace(" ", "_")}'] = data['appliances'].apply(
                lambda x: 1 if appliance in x.split(' - ') else 0
            )
        
        return data.drop('appliances', axis=1)

    def train(self):
        data = load_data()
        df = pd.DataFrame(data)
        df = self.preprocess_appliances(df)

        # Train model for No Answer cases
        X_no_answer = df[df['prospect_response'] != 'Request to Return later'][self.features_no_answer]
        y_no_answer = (df[df['prospect_response'] != 'Request to Return later']['prospect_response'] == 'Appointment set').astype(int)
        
        self.preprocessor_no_answer = self.create_preprocessor(self.features_no_answer)
        X_no_answer_processed = self.preprocessor_no_answer.fit_transform(X_no_answer)
        X_no_answer_resampled, y_no_answer_resampled = self.smote.fit_resample(X_no_answer_processed, y_no_answer)
        
        self.model_no_answer = RandomForestClassifier(class_weight='balanced', random_state=42)
        self.model_no_answer.fit(X_no_answer_resampled, y_no_answer_resampled)

        # Train model for Return Later cases
        X_return_later = df[df['prospect_response'] != 'No answer'][self.features_return_later]
        y_return_later = (df[df['prospect_response'] != 'No answer']['prospect_response'] == 'Appointment set').astype(int)
        
        self.preprocessor_return_later = self.create_preprocessor(self.features_return_later)
        X_return_later_processed = self.preprocessor_return_later.fit_transform(X_return_later)
        X_return_later_resampled, y_return_later_resampled = self.smote.fit_resample(X_return_later_processed, y_return_later)
        
        self.model_return_later = RandomForestClassifier(class_weight='balanced', random_state=42)
        self.model_return_later.fit(X_return_later_resampled, y_return_later_resampled)

    def predict(self, features, case_type):
        features_df = pd.DataFrame([features])
        features_df = self.preprocess_appliances(features_df)

        if case_type == 'No answer':
            features_processed = self.preprocessor_no_answer.transform(features_df[self.features_no_answer])
            probability = self.model_no_answer.predict_proba(features_processed)[0][1]
        elif case_type == 'Request to Return later':
            features_processed = self.preprocessor_return_later.transform(features_df[self.features_return_later])
            probability = self.model_return_later.predict_proba(features_processed)[0][1]
        else:
            raise ValueError("Invalid case_type. Must be 'No answer' or 'Request to Return later'")
        
        return probability

    def save_model(self, filepath):
        joblib.dump((self.model_no_answer, self.model_return_later, self.preprocessor_no_answer, self.preprocessor_return_later, 
                     self.features_no_answer, self.features_return_later), filepath)

    def load_model(self, filepath):
        (self.model_no_answer, self.model_return_later, self.preprocessor_no_answer, self.preprocessor_return_later, 
         self.features_no_answer, self.features_return_later) = joblib.load(filepath)

def train_and_save_model():
    predictor = SolarLeadPredictor()
    predictor.train()
    predictor.save_model('solar_lead_predictor.joblib')

def load_trained_model():
    predictor = SolarLeadPredictor()
    predictor.load_model('solar_lead_predictor.joblib')
    return predictor