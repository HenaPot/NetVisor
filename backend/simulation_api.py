from flask import Flask, request, jsonify
from flask_cors import CORS
from matlab_simulation import run_wifi_simulation


app = Flask(__name__)
CORS(app) 

@app.route("/api/simulation", methods=["POST"])
def handle_simulation():
    data = request.get_json()  

    number_of_nodes = data.get("numberOfNodes")
    frequency = data.get("frequency")
    data_size = data.get("dataSize")
    transmission_power = data.get("transmissionPower")
    number_of_access_points = data.get("numberOfAccessPoints")
    distance = data.get("distance")

    snr_values = run_wifi_simulation(frequency, transmission_power)

    return jsonify(snr_values)

if __name__ == "__main__":
    app.run(debug=True)
