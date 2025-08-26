import matlab.engine

eng = matlab.engine.start_matlab()

def build_environment(data: dict):
    """
    Builds an environment dictionary for multi-user WiFi simulation.
    """
    simulation_time = float(data.get('simulationTime', 30.0))   # in seconds
    time_step = float(data.get('timeStep', 1.0))                # in seconds
    num_nodes = int(data.get('numberOfNodes', 3))
    velocity = float(data.get('velocity', 1.5))                 # meters per second
    path_loss_exp = float(data.get('pathLossExponent', 3.2))
    rician_K_dB = float(data.get('ricianKFactor_dB', 5.0))
    num_aps = int(data.get('numberOfAccessPoints', 3))
    data_size = float(data.get('dataSize', 1000))
    transmission_powers = data.get("transmissionPowers", [23.0] * num_aps)
    frequencies = data.get("frequencies", [2.4e9] * num_aps)
    bandwidths = data.get("bandwidths", [20e6] * num_aps)
    ap_positions = data.get("apPositions", [[0,0]]*num_aps)  

    transmission_powers = [float(p) for p in transmission_powers]
    frequencies = [float(f) for f in frequencies]
    bandwidths = [float(b) for b in bandwidths]
    ap_positions = [[float(x), float(y)] for x, y in ap_positions]

    return {
        "simulationTime": simulation_time,
        "timeStep": time_step,
        "numberOfNodes": num_nodes,
        "velocity": velocity,
        "pathLossExponent": path_loss_exp,
        "ricianKFactor_dB": rician_K_dB,
        "numberOfAccessPoints": num_aps,
        "dataSize": data_size,
        "transmissionPowers": transmission_powers,
        "frequencies": frequencies,
        "bandwidths": bandwidths,
        "apPositions": ap_positions,
    }
