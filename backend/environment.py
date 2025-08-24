import matlab.engine

eng = matlab.engine.start_matlab()

def build_environment(data: dict):
    """
    Builds an environment dictionary for multi-user WiFi simulation.

    Parameters:
    - data (dict): Request data from the frontend.

    Returns:
    - dict: Environment parameters compatible with MATLAB.
    """
    simulation_time = float(data.get('simulationTime', 30.0))   # in seconds
    time_step = float(data.get('timeStep', 1.0))                # in seconds
    num_nodes = int(data.get('numberOfNodes', 3))
    velocity = float(data.get('velocity', 1.5))                 # meters per second
    frequency = float(data.get('frequency', 2.4))               # GHz
    transmission_power = float(data.get('transmissionPower', 23))
    path_loss_exp = float(data.get('pathLossExponent', 3.2))
    rician_K_dB = float(data.get('ricianKFactor_dB', 5.0))
    num_aps = int(data.get('numberOfAccessPoints', 3))
    data_size = float(data.get('dataSize', 1000))

    return {
        "simulationTime": simulation_time,
        "timeStep": time_step,
        "numberOfNodes": num_nodes,
        "velocity": velocity,
        "frequency": frequency,
        "transmissionPower": transmission_power,
        "pathLossExponent": path_loss_exp,
        "ricianKFactor_dB": rician_K_dB,
        "numberOfAccessPoints": num_aps,
        "dataSize": data_size
    }
