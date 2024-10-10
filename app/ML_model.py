import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
import joblib
from database import load_data, update_prediction_fields

class SolarLeadPredictor:
    def __init__(self):
        self.model_no_answer = None
        self.model_return_later = None
        self.preprocessor_no_answer = None
        self.preprocessor_return_later = None
        self.smote = SMOTE(random_state=42)
        self.appliance_categories = ['Swimming pool', 'Air Conditioning', 'Electrical Vehicle(s)', 'Large garden', 'Other']
        self.base_features = ['solar_panels_on_roof', 'roof_type_condition', 'shading_issues'] + [f'has_{app.lower().replace(" ", "_")}' for app in self.appliance_categories]
        self.features_no_answer = self.base_features
        self.features_return_later = self.base_features + ['electricity_bill_estimate', 'number_of_decision_makers', 'approximate_age', 'number_inhabitants']
        self.all_categories = {
            'solar_panels_on_roof': ['Yes, new PV (less than 5 years old)', 'Yes, old PV (more than 5 years old)', 'Yes, thermal panels', 'No', 'Unknown'],
            'roof_type_condition': ['Flat, in good conditions', 'Flat, needs repair', 'Pitched, in good condition', 'Pitched, needs repair', 'Other (specify in Comments)'],
            'shading_issues': ['None', 'Partial', 'Significant', 'Unknown'],
            'number_of_decision_makers': ['One', 'Two', 'Multiple', 'Unknown'],
            'approximate_age': ['18-30', '31-45', '46-60', '61-80', '81+', 'Unknown'],
            'number_inhabitants': ['1', '2', '3-4', '5+', 'Unknown']
        }
    
    def create_preprocessor(self, features):
        categorical_features = [f for f in features if f not in ['electricity_bill_estimate'] + [f'has_{app.lower().replace(" ", "_")}' for app in self.appliance_categories]]
        numeric_features = ['electricity_bill_estimate'] if 'electricity_bill_estimate' in features else []
        binary_features = [f for f in features if f.startswith('has_')]

        categorical_transformer = OneHotEncoder(
            categories=[self.all_categories[f] for f in categorical_features],
            handle_unknown='ignore', 
            sparse_output=False
        )
        numeric_transformer = StandardScaler()

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features),
                ('bin', 'passthrough', binary_features)
            ])

        return preprocessor
    
    def preprocess_appliances(self, data):
        # Ensure 'appliances' column exists, if not create it with empty strings
        if 'appliances' not in data.columns:
            data['appliances'] = ''
        
        # Handle NaN values
        data['appliances'] = data['appliances'].fillna('')
        
        for appliance in self.appliance_categories:
            # Use ' - ' as the separator, and check for exact matches
            data[f'has_{appliance.lower().replace(" ", "_")}'] = data['appliances'].apply(
                lambda x: 1 if appliance in x.split(' - ') else 0
            )
        
        return data.drop('appliances', axis=1)

    def train(self):
        data = load_data()
        df = pd.DataFrame(data)
        df = self.preprocess_appliances(df)

        # Filter out 'No answer' and 'Request to Return later' responses
        df_filtered = df[~df['prospect_response'].isin(['No answer', 'Request to Return later'])]

        # Prepare target variable
        y = (df_filtered['prospect_response'] == 'Appointment set').astype(int)

        # Train model for No Answer cases (less features)
        X_no_answer = df_filtered[self.features_no_answer]
        
        self.preprocessor_no_answer = self.create_preprocessor(self.features_no_answer)
        X_no_answer_processed = self.preprocessor_no_answer.fit_transform(X_no_answer)
        X_no_answer_resampled, y_no_answer_resampled = self.smote.fit_resample(X_no_answer_processed, y)
        
        self.model_no_answer = RandomForestClassifier(class_weight='balanced', random_state=42)
        self.model_no_answer.fit(X_no_answer_resampled, y_no_answer_resampled)

        # Train model for Return Later cases (more features)
        X_return_later = df_filtered[self.features_return_later]
        
        self.preprocessor_return_later = self.create_preprocessor(self.features_return_later)
        X_return_later_processed = self.preprocessor_return_later.fit_transform(X_return_later)
        X_return_later_resampled, y_return_later_resampled = self.smote.fit_resample(X_return_later_processed, y)
        
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

    def predict_batch(self, data):
        results = []
        for item in data:
            features_df = pd.DataFrame([item])
            features_df = self.preprocess_appliances(features_df)
            
            if item['prospect_response'] == 'No answer':
                features_processed = self.preprocessor_no_answer.transform(features_df[self.features_no_answer])
                probability = self.model_no_answer.predict_proba(features_processed)[0][1]
            elif item['prospect_response'] == 'Request to Return later':
                features_processed = self.preprocessor_return_later.transform(features_df[self.features_return_later])
                probability = self.model_return_later.predict_proba(features_processed)[0][1]
            else:
                continue  # Skip items that are not 'No answer' or 'Request to Return later'
            
            worth_returning = "Yes" if probability > 0.5 else "No"
            
            results.append({
                '_id': item['_id'],
                'probability': probability,
                'worth_returning': worth_returning
            })
            
            # Update the prediction fields in the database
            update_prediction_fields(item['_id'], probability, worth_returning)
        
        return results

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