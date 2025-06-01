# app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
from matlab_simulation import run_wifi_simulation
from environment import build_environment 

app = Flask(__name__)
CORS(app)

@app.route("/api/simulation", methods=["POST"])
def handle_simulation():
    data = request.get_json()
    env = build_environment(data) 
    snr_values = run_wifi_simulation(env)
    return jsonify(snr_values)

if __name__ == "__main__":
    app.run(debug=True)
