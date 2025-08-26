import matlab.engine
import numpy as np
from mobility import generate_realistic_user_positions

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
    time_step = env["timeStep"]
    n_steps = int(env["simulationTime"] / time_step)
    ap_positions = env["apPositions"]
    velocity = env["velocity"]

    aps_matlab = {
        "tx_power_dBm": env["transmissionPowers"],
        "position": [matlab.double([[float(pos[0]), float(pos[1])]]) for pos in ap_positions],
        "frequency_Hz": env["frequencies"],
        "bandwidth_Hz": env["bandwidths"]
    }

    user_positions = generate_realistic_user_positions(
        n_users=n_users,
        n_steps=n_steps,
        ap_positions=ap_positions,
        velocity=velocity,
        time_step=time_step
    )
    positions_matlab = matlab.double(user_positions.tolist())

    result = eng.simulate_multi_user_wifi(
        aps_matlab,
        positions_matlab,
        float(env["pathLossExponent"]),
        float(env["ricianKFactor_dB"]),
        n_aps,
        nargout=1
    )

    return to_python(result)
