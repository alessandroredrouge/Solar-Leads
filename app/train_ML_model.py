import os
if os.environ.get('FLASK_ENV') == 'production':
    from app.ML_model import train_and_save_model
else:
    from ML_model import train_and_save_model

if __name__ == "__main__":
    train_and_save_model()
    print("Model trained and saved successfully.")