# matlab_simulation.py

import matlab.engine

eng = matlab.engine.start_matlab()

def run_wifi_simulation(env: dict):
    """
    Runs the MATLAB wifi_signal_simulation function using provided environment data.

    Parameters:
    - env (dict): Python dict to be passed as MATLAB struct.

    Returns:
    - dictionary: {"snr": [<snr_values>], "distance": [<distance_values>]}.
    """
    try:
        env_struct = eng.struct(env)
        result = eng.wifi_signal_simulation(env_struct, nargout=2)

        snr = [val[0] for val in result[1]]
        distance = [val[0] for val in result[0]]
        return {"snr": snr, "distance": distance}

    except Exception as e:
        print("MATLAB simulation error:", str(e))
        return {"error": str(e)}
