import matlab.engine
import numpy as np
import scipy.io
from mobility import generate_linear_mobility

eng = matlab.engine.start_matlab()
eng.addpath(r'C:\Faks 5\SDP\NetVisor\backend\matlab_scripts', nargout=0)

def to_python(obj):
    """Recursively convert MATLAB/NumPy types to Python lists/floats/ints."""
    import matlab
    import numpy as np
    if isinstance(obj, matlab.double):
        return [to_python(x) for x in obj]
    elif isinstance(obj, (list, tuple)):
        return [to_python(x) for x in obj]
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif hasattr(obj, '__float__'):
        return float(obj)
    elif hasattr(obj, '__int__'):
        return int(obj)
    elif isinstance(obj, dict):
        return {k: to_python(v) for k, v in obj.items()}
    else:
        return obj

def run_multiuser_wifi_simulation(env):
    n_aps = env["numberOfAccessPoints"]
    n_users = env["numberOfNodes"]
    n_steps = int(env["simulationTime"] / env["timeStep"])
    ap_positions = env["apPositions"]

    aps_matlab = {
        "tx_power_dBm": env["transmissionPowers"],
        "position": [matlab.double([[float(pos[0]), float(pos[1])]]) for pos in ap_positions],
        "frequency_Hz": env["frequencies"],
        "bandwidth_Hz": env["bandwidths"]
    }

    # Generate user positions (movement logic untouched)
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
        n_aps,
        nargout=1
    )

    return to_python(result)
