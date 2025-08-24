# matlab_simulation.py

import matlab.engine
import numpy as np
import scipy.io
from mobility import generate_linear_mobility

eng = matlab.engine.start_matlab()
eng.addpath(r'C:\Faks 5\SDP\NetVisor\backend\matlab_scripts', nargout=0)

def run_multiuser_wifi_simulation(env):
    """
    Runs the multi-user WiFi simulation in MATLAB with the given environment parameters.
    Parameters:
        env (dict): A dictionary containing environment parameters such as number of nodes,
                    number of access points, simulation time, time step, velocity, path loss
                    exponent, Rician K-factor, and hysteresis.
    Returns:
        dict: A dictionary containing the simulation results, including user-specific data
              and time vector.
    """
    n_aps = env["numberOfAccessPoints"]
    n_users = env["numberOfNodes"]
    n_steps = int(env["simulationTime"] / env["timeStep"])

    # Example AP positions (spread out)
    ap_positions = [[0, 0], [40, 0], [20, 20]]
    ap_freqs = [2.4e9, 2.42e9, 2.4e9]
    ap_bandwidth = 20e6

    # Build AP struct array as dict of lists
    aps_matlab = {
        "tx_power_dBm": [float(env["transmissionPower"])] * 3,
        "position": [matlab.double([[float(pos[0]), float(pos[1])]]) for pos in ap_positions],
        # Note the extra brackets: [[x, y]] -> 1x2 in MATLAB
        "frequency_Hz": [2.4e9, 2.42e9, 2.4e9],
        "bandwidth_Hz": [20e6] * 3
    }

    # Generate user_positions: [n_users x 2 x n_steps]
    # Example: circular trajectories around APs
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

    # Other parameters
    path_loss_exp = float(env["pathLossExponent"])
    rician_K_dB = float(env["ricianKFactor_dB"])
    hysteresis_dB = 3

    # Call MATLAB
    result = eng.simulate_multi_user_wifi(
        aps_matlab,
        positions_matlab,
        path_loss_exp,
        rician_K_dB,
        hysteresis_dB,
        nargout=1
    )
    return result
