import numpy as np

def generate_linear_mobility(num_nodes, sim_time, time_step, velocity=1.5):
    time_vector = np.arange(0, sim_time + time_step, time_step)
    num_steps = len(time_vector)

    # positions: (num_nodes, 2, num_steps)
    positions = np.zeros((num_nodes, 2, num_steps))
    for node in range(num_nodes):
        direction = np.random.rand(2) - 0.5
        direction /= np.linalg.norm(direction)
        for t_idx, t in enumerate(time_vector):
            positions[node, :, t_idx] = velocity * t * direction

    # Rearranged: (nodes, time, coordinates)
    positions.shape == (num_nodes, 2, num_steps)

    return positions, time_vector
