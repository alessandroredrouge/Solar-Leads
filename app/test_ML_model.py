from app.ML_model import load_trained_model
from app.database import load_data
import random

def get_test_cases(data, n=100):
    no_answer = [d for d in data if d['prospect_response'] == 'No answer']
    return_later = [d for d in data if d['prospect_response'] == 'Request to Return later']
    
    test_cases = (random.sample(no_answer, min(n//2, len(no_answer))) + 
                  random.sample(return_later, min(n//2, len(return_later))))
    random.shuffle(test_cases)
    return test_cases

def main():
    model = load_trained_model()
    data = load_data()
    
    test_cases = get_test_cases(data)
    
    print("ML Model Test Results:")
    print("----------------------")
    
    for case in test_cases:
        case_type = 'No answer' if case['prospect_response'] == 'No answer' else 'Request to Return later'
        probability = model.predict(case, case_type)
        worth_returning = "Yes" if probability > 0.5 else "No"
        
        print(f"Case ID: {case['_id']}")
        print(f"Case Type: {case_type}")
        print(f"Probability of Appointment: {probability:.2f}")
        print(f"Worth Returning: {worth_returning}")
        print("----------------------")

if __name__ == "__main__":
    main()