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
    simulation_time = float(data.get('simulationTime', 100.0))   # in seconds
    time_step = float(data.get('timeStep', 1.0))                 # in seconds
    num_nodes = int(data.get('numberOfNodes', 10))
    velocity = float(data.get('velocity', 1.5))                  # meters per second

    return {
        'f_GHz': float(data.get('frequency', 2.4)),
        'txPower_dBm': float(data.get('transmissionPower', 20)),
        'bandwidth_Hz': float(20e6),
        'noiseFigure_dB': float(10),
        'refetenceDistance_m': float(1.0),
        'pathLossExponent': float(data.get('pathLossExponent', 3.0)),
        'ricianKFactor_dB': float(data.get('ricianKFactor_dB', 6.0)),

        # Mobility parameters used for mat generation
        'numNodes': num_nodes,
        'simTime_s': simulation_time,
        'timeStep_s': time_step,
        'velocity_mps': velocity,

        # Optional network model fields
        'numberOfAPs': float(data.get('numberOfAccessPoints', 1)),
        'dataSize': float(data.get('dataSize', 1000))
    }
