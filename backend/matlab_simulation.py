# matlab_simulation.py

import matlab.engine
import numpy as np
import scipy.io
from mobility import generate_linear_mobility  # ✅ Import this

eng = matlab.engine.start_matlab()

def run_wifi_simulation(env: dict):
    """
    Runs the MATLAB wifi_signal_simulation function using provided environment data.
    Generates mobility, saves .mat, and runs MATLAB simulation.
    """
    try:
        # ✅ Step 1: Generate mobility and save .mat
        num_nodes = env.get("numNodes", 10)
        sim_time = env.get("simTime_s", 20.0)
        time_step = env.get("timeStep_s", 1.0)
        velocity = env.get("velocity_mps", 1.5)

        node_positions, time_vector = generate_linear_mobility(num_nodes, sim_time, time_step, velocity)
        scipy.io.savemat("C:/Users/Hena/OneDrive/Documents/MATLAB/node_positions.mat", {
            "node_positions": node_positions,
            "time_vector": time_vector
        })

        # ✅ Step 2: Call MATLAB with environment struct
        env_struct = eng.struct(env)
        result = eng.wifi_signal_simulation_with_mobility(env_struct, nargout=2)

        # Preserve 2D structure instead of flattening
        snr = [[float(cell) for cell in row] for row in result[0]]
        distance = [[float(cell) for cell in row] for row in result[1]]
        time_vector = [float(t) for t in time_vector]

        return {"snr": snr, "distance": distance, "time": time_vector}

    except Exception as e:
        print("MATLAB simulation error:", str(e))
        return {"error": str(e)}
