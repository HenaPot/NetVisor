import numpy as np

def generate_realistic_user_positions(n_users, n_steps, ap_positions, velocity, time_step):
    """
    Generates realistic user positions for a multi-AP WiFi simulation.
    
    Each user performs a random waypoint movement around APs with some jitter.
    """
    user_positions = np.zeros((n_users, 2, n_steps))
    ap_positions = np.array(ap_positions)

    # Assign each user a random starting AP
    user_targets = np.random.randint(0, len(ap_positions), size=n_users)
    user_current_pos = np.array([ap_positions[ap_idx] + np.random.uniform(-2,2,2) 
                                 for ap_idx in user_targets])

    for t in range(n_steps):
        for u in range(n_users):
            target_ap_idx = user_targets[u]
            # Small random offset around AP to simulate roaming
            target_pos = ap_positions[target_ap_idx] + np.random.uniform(-5, 5, 2)

            # Compute direction vector
            direction = target_pos - user_current_pos[u]
            distance = np.linalg.norm(direction)
            if distance > 0:
                step = min(velocity * time_step, distance)
                user_current_pos[u] += (direction / distance) * step

            # Occasionally choose a new target AP
            if np.random.rand() < 0.05:  # 5% chance per step
                user_targets[u] = np.random.randint(0, len(ap_positions))

            user_positions[u, :, t] = user_current_pos[u]

    return user_positions
