from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler

app = Flask(__name__)
CORS(app)

# --- Scaler Initialization ---
# Load the original dataset to fit the scaler
try:
    df = pd.read_csv('collegePlace.csv')
    # Use the same columns as in the notebook
    X = df[['CGPA', 'HistoryOfBacklogs']] 
    
    # Initialize and fit the scaler
    scaler = StandardScaler()
    scaler.fit(X)
except FileNotFoundError as e:
    print("===================================================")
    print("ERROR: collegePlace.csv not found.")
    print("Please make sure the dataset is in the same directory as app.py")
    print("===================================================")
    raise e

# --- Model Loading ---
try:
    with open('model.pkl', 'rb') as f:
        model = pickle.load(f)
except FileNotFoundError as e:
    print("===================================================")
    print("ERROR: model.pkl not found.")
    print("Please make sure you have run placement.ipynb to generate this file.")
    print("===================================================")
    raise e

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        cgpa = data['cgpa']
        backlogs = data['history_of_backlogs']

        # Prepare the input data
        input_data = np.array([[cgpa, backlogs]])

        # Scale the input data using the pre-fitted scaler
        scaled_data = scaler.transform(input_data)

        # Make prediction
        prediction = model.predict(scaled_data)[0]
        probability = model.predict_proba(scaled_data)[0][1]

        return jsonify({
            'prediction': int(prediction),
            'probability': float(probability),
            'confidence': abs(probability - 0.5) * 2
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400


if __name__ == '__main__':
    app.run(debug=True, port=5000) 