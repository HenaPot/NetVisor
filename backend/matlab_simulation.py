# matlab_simulation.py

import matlab.engine
import numpy as np
import scipy.io
from mobility import generate_linear_mobility

eng = matlab.engine.start_matlab()
eng.addpath(r'C:\Faks 5\SDP\NetVisor\backend\matlab_scripts', nargout=0)

def run_multiuser_wifi_simulation(env):
    n_aps = env["numberOfAccessPoints"]
    n_users = env["numberOfNodes"]
    n_steps = int(env["simulationTime"] / env["timeStep"])

    # Example AP positions
    ap_positions = [[0, 0], [40, 0], [20, 20]]

    # Build AP struct for MATLAB
    aps_matlab = {
        "tx_power_dBm": [float(env["transmissionPower"])] * 3,
        "position": [matlab.double([[float(pos[0]), float(pos[1])]]) for pos in ap_positions],
        "frequency_Hz": [2.4e9, 2.42e9, 2.4e9],
        "bandwidth_Hz": [20e6] * 3
    }

    # Generate user positions
    user_positions = np.zeros((n_users, 2, n_steps))
    radii = [10, 8, 6]
    angular_speeds = [2*np.pi/30, 2*np.pi/25, 2*np.pi/20]
    centers = np.array(ap_positions)
    for u in range(n_users):
        for t in range(n_steps):
            angle = angular_speeds[u] * t
            user_positions[u, 0, t] = centers[u, 0] + radii[u] * np.cos(angle)
            user_positions[u, 1, t] = centers[u, 1] + radii[u] * np.sin(angle)
    positions_matlab = matlab.double(user_positions.tolist())

    # Call MATLAB
    result = eng.simulate_multi_user_wifi(
        aps_matlab,
        positions_matlab,
        float(env["pathLossExponent"]),
        float(env["ricianKFactor_dB"]),
        3,
        nargout=1
    )

    # --- Convert MATLAB result to Python-native types ---
    py_result = {
        "time": list(result["time"]),
        "users_sinr": [
            [list(row) for row in result["users_sinr"][u]] for u in range(n_users)
        ],
        "users_handover": [
            list(result["users_handover"][u]) for u in range(n_users)
        ],
        "users_throughput": [
            list(result["users_throughput"][u]) for u in range(n_users)
        ],
        "users_distance": [
            [list(row) for row in result["users_distance"][u]] for u in range(n_users)
        ]
    }

    return py_result
