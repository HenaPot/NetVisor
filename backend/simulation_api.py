from flask import Flask, request, jsonify
from flask_cors import CORS
from core_simulation import run_multiuser_wifi_simulation
from environment import build_environment

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route("/api/simulation", methods=["POST"])
def handle_multiuser_simulation():
    data = request.get_json()
    env = build_environment(data)
    result = run_multiuser_wifi_simulation(env)
    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)
