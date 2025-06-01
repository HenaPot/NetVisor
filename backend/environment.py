# environment.py

import matlab.engine

eng = matlab.engine.start_matlab()

def build_environment(data: dict):
    """
    Builds an environment dictionary suitable for conversion to a MATLAB struct.

    Parameters:
    - data (dict): Request data from the frontend.

    Returns:
    - dict: Environment parameters compatible with MATLAB.
    """
    return {
        'f_GHz': float(data.get('frequency', 2.4)),
        'txPower_dBm': float(data.get('transmissionPower', 20)),
        'bandwidth_Hz': float(20e6),
        'noiseFigure_dB': float(10),
        'distances': eng.transpose(eng.colon(1.0, float(data.get('distance', 100)))), 
        'numberOfNodes': float(data.get('numberOfNodes', 10)),
        'dataSize': float(data.get('dataSize', 1000)),
        'numberOfAPs': float(data.get('numberOfAccessPoints', 1))
    }
