import numpy as np
from scipy.stats import norm


def calculate_user_ap_distances(ap_positions: np.ndarray,
                                user_positions: np.ndarray) -> np.ndarray:
    """
    Vectorized port of MATLAB calculate_user_ap_distances.
    """
    ap_positions = np.asarray(ap_positions, dtype=float)          # (n_aps, 2)
    user_positions = np.asarray(user_positions, dtype=float)      # (n_users, 2, n_steps)

    ap_expanded = ap_positions[:, None, :, None]                  # (n_aps, 1, 2, 1)
    user_expanded = user_positions[None, :, :, :]                 # (1, n_users, 2, n_steps)

    diffs = user_expanded - ap_expanded
    dist_matrix = np.sqrt(np.sum(diffs**2, axis=2))                # (n_aps, n_users, n_steps)
    return dist_matrix


def compute_received_power(distances, ap, path_loss_exp, rician_K_dB):
    """
    Port of MATLAB compute_received_power.
    Returns received power in linear scale (mW).
    """
    # Extract fields
    freq_Hz = ap.get("frequency_Hz")
    tx_power_dBm = ap.get("tx_power_dBm")
    bandwidth_Hz = ap.get("bandwidth_Hz")

    # Constants
    c = 3e8
    lambda_c = c / freq_Hz
    d0 = 1.0

    # Free-space path loss at reference distance
    pl_d0 = 20 * np.log10(4 * np.pi * d0 / lambda_c)

    # Log-distance path loss
    path_loss_dB = pl_d0 + 10 * path_loss_exp * np.log10(distances / d0 + np.finfo(float).eps)

    # Rician fading
    K_linear = 10 ** (rician_K_dB / 10.0)
    s = np.sqrt(K_linear / (K_linear + 1))
    sigma = np.sqrt(1 / (2 * (K_linear + 1)))

    fading_real = s + sigma * np.random.randn(*np.shape(distances))
    fading_imag = sigma * np.random.randn(*np.shape(distances))
    fading_linear = fading_real**2 + fading_imag**2
    fading_dB = 10 * np.log10(fading_linear + np.finfo(float).eps)

    # Received power in dBm
    rx_power_dBm = tx_power_dBm - path_loss_dB + fading_dB

    # Convert to linear (mW)
    return 10 ** (rx_power_dBm / 10.0)


def compute_snr_with_interference(distances, serving_ap, interfering_aps,
                                  path_loss_exp, rician_K_dB):
    """
    Port of MATLAB compute_snr_with_interference.
    Returns SINR in dB.
    """
    freq_Hz = serving_ap.get("frequency_Hz")
    bandwidth_Hz = serving_ap.get("bandwidth_Hz")

    # Desired power
    desired_power = compute_received_power(distances, serving_ap,
                                           path_loss_exp, rician_K_dB)

    # Interference (co-channel only)
    interference_power = 0.0
    freq_tolerance_Hz = 1e6
    for ap in interfering_aps:
        intf_freq_Hz = ap.get("frequency_Hz")
        if abs(intf_freq_Hz - freq_Hz) < freq_tolerance_Hz:
            intf_power = compute_received_power(ap["distances"], ap,
                                                path_loss_exp, rician_K_dB)
            interference_power += intf_power

    # Noise power (thermal noise density -174 dBm/Hz + NF 7 dB)
    noise_power_dBm = -174 + 10 * np.log10(bandwidth_Hz) + 7
    noise_power = 10 ** (noise_power_dBm / 10.0)

    # SINR linear
    sinr_linear = desired_power / (interference_power + noise_power)

    return 10 * np.log10(sinr_linear + np.finfo(float).eps)


def handover_decision_with_interference(dist_matrix, aps, path_loss_exp, rician_K_dB, hysteresis_dB=3):
    """
    Port of MATLAB handover_decision_with_interference.
    Selects serving AP per user over time based on SINR with hysteresis.
    """
    n_aps, n_steps = dist_matrix.shape
    sinr_matrix = np.zeros((n_aps, n_steps))
    freq_tolerance = 1e6  # 1 MHz

    # Compute SINR per AP
    for i in range(n_aps):
        serving_ap = aps[i]
        # Interferers = same-frequency APs (within 1 MHz)
        intf_aps = []
        for j in range(n_aps):
            if j != i and abs(aps[j]["frequency_Hz"] - serving_ap["frequency_Hz"]) < freq_tolerance:
                intf_aps.append({
                    "tx_power_dBm": aps[j]["tx_power_dBm"],
                    "frequency_Hz": aps[j]["frequency_Hz"],
                    "bandwidth_Hz": aps[j]["bandwidth_Hz"],
                    "distances": dist_matrix[j, :]
                })
        sinr_matrix[i, :] = compute_snr_with_interference(dist_matrix[i, :],
                                                          serving_ap,
                                                          intf_aps,
                                                          path_loss_exp,
                                                          rician_K_dB)

    # Smooth SINR (moving average)
    kernel = np.ones(3) / 3.0
    for i in range(n_aps):
        sinr_matrix[i, :] = np.convolve(sinr_matrix[i, :], kernel, mode="same")

    # Handover decision with hysteresis
    connected_ap = np.zeros(n_steps, dtype=int)
    current_ap = np.argmax(sinr_matrix[:, 0])

    for t in range(n_steps):
        current_sinr = sinr_matrix[current_ap, t]
        best_ap = current_ap
        for ap_idx in range(n_aps):
            if ap_idx != current_ap:
                cand_sinr = sinr_matrix[ap_idx, t]
                if cand_sinr > current_sinr + hysteresis_dB:
                    best_ap = ap_idx
        current_ap = best_ap
        connected_ap[t] = current_ap

    return connected_ap + 1  # 1-based indexing to mimic MATLAB


# --- BER helper functions ---
def ber_bpsk(snr_linear):
    return norm.sf(np.sqrt(2 * snr_linear))

def ber_qpsk(snr_linear):
    return norm.sf(np.sqrt(2 * snr_linear))

def ber_16qam(snr_linear):
    return 3/8 * norm.sf(np.sqrt((4/5) * snr_linear))

def ber_64qam(snr_linear):
    return 7/24 * norm.sf(np.sqrt((6/7) * snr_linear))


def compute_throughput_with_mcs(distances, ap, interfering_aps,
                                path_loss_exp, rician_K_dB,
                                n_users_on_ap):
    """
    Port of MATLAB compute_throughput_with_mcs.
    Returns throughput, MAC throughput, PER, retries, collisions.
    """
    mcs_table = [
        ("BPSK",  1/2,  6.5),
        ("QPSK",  1/2, 13),
        ("QPSK",  3/4, 19.5),
        ("16QAM", 1/2, 26),
        ("16QAM", 3/4, 39),
        ("64QAM", 2/3, 52),
        ("64QAM", 3/4, 58.5),
        ("64QAM", 5/6, 65),
    ]

    packet_length_bits = 1500 * 8
    max_retries = 3

    snr_dB = compute_snr_with_interference(distances, ap, interfering_aps,
                                           path_loss_exp, rician_K_dB)
    snr_linear = 10 ** (snr_dB / 10)

    n_steps = len(distances)
    throughput_bps = np.zeros(n_steps)
    mac_throughput_bps = np.zeros(n_steps)
    per = np.zeros(n_steps)
    retries = np.zeros(n_steps)
    collision_flag = np.zeros(n_steps)

    # MAC efficiency = naive CSMA/CA approximation
    mac_efficiency = 1 / np.maximum(1, n_users_on_ap)

    for t in range(n_steps):
        # --- Select MCS index based on SNR thresholds ---
        if snr_dB[t] < 5:
            mcs_idx = 0
        elif snr_dB[t] < 10:
            mcs_idx = 1
        elif snr_dB[t] < 15:
            mcs_idx = 2
        elif snr_dB[t] < 20:
            mcs_idx = 3
        elif snr_dB[t] < 25:
            mcs_idx = 4
        elif snr_dB[t] < 30:
            mcs_idx = 5
        elif snr_dB[t] < 35:
            mcs_idx = 6
        else:
            mcs_idx = 7

        mod_type, _, phy_rate_Mbps = mcs_table[mcs_idx]

        # --- Compute BER ---
        if mod_type == "BPSK":
            ber_val = ber_bpsk(snr_linear[t])
        elif mod_type == "QPSK":
            ber_val = ber_qpsk(snr_linear[t])
        elif mod_type == "16QAM":
            ber_val = ber_16qam(snr_linear[t])
        elif mod_type == "64QAM":
            ber_val = ber_64qam(snr_linear[t])

        # --- Compute PER ---
        per[t] = 1 - np.exp(-ber_val * packet_length_bits)

        # --- Simulate retries ---
        success = False
        for r in range(max_retries):
            if np.random.rand() > per[t]:
                success = True
                retries[t] = r
                break
        if not success:
            retries[t] = max_retries
            collision_flag[t] = 1

        # --- Throughput ---
        if success:
            throughput_bps[t] = phy_rate_Mbps * 1e6
        else:
            throughput_bps[t] = 0

        # MAC throughput with efficiency factor
        mac_throughput_bps[t] = throughput_bps[t] * mac_efficiency[t]

    return throughput_bps, mac_throughput_bps, per, retries, collision_flag


def simulate_multi_user_wifi_py(aps, user_positions, path_loss_exp, rician_K_dB, hysteresis_dB=3.0):
    """
    Python translation of the MATLAB simulate_multi_user_wifi function.

    Parameters
    ----------
    aps : list of dict
        AP metadata, each dict must contain keys:
        'tx_power_dBm', 'frequency_Hz', 'bandwidth_Hz', 'position' (2-element).
    user_positions : ndarray (n_users, 2, n_steps)
        user coordinates over time (same format as MATLAB).
    path_loss_exp, rician_K_dB, hysteresis_dB : floats

    Returns
    -------
    result_dict : dict matching MATLAB result_struct but with Python lists
    """
    # shapes
    user_positions = np.asarray(user_positions, dtype=float)
    n_users, _, n_steps = user_positions.shape
    n_aps = len(aps)

    # compute full distance matrix: (n_aps, n_users, n_steps)
    dist_matrix = calculate_user_ap_distances(
        np.array([ap["position"] for ap in aps], dtype=float),
        user_positions
    )

    # Prepare containers (MATLAB used cell arrays -> we will store python lists)
    sinr_all = [None] * n_users
    handover_all = [None] * n_users
    throughput_all = [None] * n_users
    mac_throughput_all = [None] * n_users
    per_all = [None] * n_users
    retries_all = [None] * n_users
    collisions_all = [None] * n_users
    distance_all = [None] * n_users

    # --- First pass: compute handovers for every user (so we can count users per AP/time) ---
    handovers_users = np.zeros((n_users, n_steps), dtype=int)
    for u in range(n_users):
        user_dist_matrix = dist_matrix[:, u, :]    # (n_aps, n_steps)
        # handover_decision_with_interference expects dist_matrix for that user and aps metadata
        handover_seq = handover_decision_with_interference(user_dist_matrix, aps,
                                                           path_loss_exp, rician_K_dB,
                                                           hysteresis_dB)
        # handover_decision_with_interference returns 1-based AP indexes (to match MATLAB). Keep them.
        handovers_users[u, :] = np.asarray(handover_seq, dtype=int)

    # Count users per AP per timestep (n_users_on_ap: shape (n_aps, n_steps))
    n_users_on_ap = np.zeros((n_aps, n_steps), dtype=int)
    for t in range(n_steps):
        # handovers_users[:, t] are 1-based AP indices
        bins, counts = np.unique(handovers_users[:, t], return_counts=True)
        for ap_idx_1based, cnt in zip(bins, counts):
            # convert to 0-based index
            n_users_on_ap[ap_idx_1based - 1, t] = cnt

    # --- Per-user computations (mirrors MATLAB outer loop) ---
    for u in range(n_users):
        user_dist_matrix = dist_matrix[:, u, :]    # (n_aps, n_steps)
        handover = handovers_users[u, :]           # 1-based indices (n_steps,)

        # per-AP matrices for this user
        throughput_matrix = np.zeros((n_aps, n_steps))
        mac_matrix = np.zeros((n_aps, n_steps))
        per_matrix = np.zeros((n_aps, n_steps))
        retries_matrix = np.zeros((n_aps, n_steps))
        collisions_matrix = np.zeros((n_aps, n_steps))
        sinr_matrix = np.zeros((n_aps, n_steps))

        # compute per-AP metrics for this user
        for ap_idx in range(n_aps):
            # Build serving_ap dict and interfering_aps list like MATLAB code expected
            serving_ap = {
                "tx_power_dBm": aps[ap_idx]["tx_power_dBm"],
                "frequency_Hz": aps[ap_idx]["frequency_Hz"],
                "bandwidth_Hz": aps[ap_idx]["bandwidth_Hz"],
                "position": aps[ap_idx].get("position", [0.0, 0.0]),
                "distances": user_dist_matrix[ap_idx, :]    # distances from this AP to this user over time
            }

            # interfering APs: all other aps (we'll let compute_snr_with_interference filter by freq tolerance)
            intf_aps = []
            for j in range(n_aps):
                if j == ap_idx:
                    continue
                intf_aps.append({
                    "tx_power_dBm": aps[j]["tx_power_dBm"],
                    "frequency_Hz": aps[j]["frequency_Hz"],
                    "bandwidth_Hz": aps[j]["bandwidth_Hz"],
                    "position": aps[j].get("position", [0.0, 0.0]),
                    "distances": user_dist_matrix[j, :]
                })

            # n_users_on_ap for THIS AP (vector length n_steps)
            n_users_on_ap_for_ap = n_users_on_ap[ap_idx, :]

            # compute throughput, mac throughput, per, retries, collision_flag (vectors length n_steps)
            thr_bps, mac_thr_bps, per_vec, retries_vec, coll_vec = compute_throughput_with_mcs(
                user_dist_matrix[ap_idx, :],   # distances for this ap -> user
                serving_ap,
                intf_aps,
                path_loss_exp,
                rician_K_dB,
                n_users_on_ap_for_ap
            )

            throughput_matrix[ap_idx, :] = thr_bps
            mac_matrix[ap_idx, :] = mac_thr_bps
            per_matrix[ap_idx, :] = per_vec
            retries_matrix[ap_idx, :] = retries_vec
            collisions_matrix[ap_idx, :] = coll_vec

            # compute sinr matrix for this ap->user (vector)
            sinr_matrix[ap_idx, :] = compute_snr_with_interference(
                user_dist_matrix[ap_idx, :],
                serving_ap,
                intf_aps,
                path_loss_exp,
                rician_K_dB
            )

        # --- Select final values based on handover sequence (1-based handover) ---
        # Convert handover to 0-based indices for numpy indexing
        handover_zero = handover.astype(int) - 1   # shape (n_steps,)
        idx_time = np.arange(n_steps)

        throughput_final = throughput_matrix[handover_zero, idx_time]
        mac_final = mac_matrix[handover_zero, idx_time]
        per_final = per_matrix[handover_zero, idx_time]
        retries_final = retries_matrix[handover_zero, idx_time]
        collisions_final = collisions_matrix[handover_zero, idx_time]
        sinr_final = sinr_matrix[handover_zero, idx_time]

        # Save in lists in MATLAB-like structure
        # sinr_all stores the full sinr_matrix (n_aps x n_steps) per user (like MATLAB cell)
        sinr_all[u] = sinr_matrix.tolist()
        handover_all[u] = handover.tolist()
        throughput_all[u] = throughput_final.tolist()
        mac_throughput_all[u] = mac_final.tolist()
        per_all[u] = per_final.tolist()
        retries_all[u] = retries_final.tolist()
        collisions_all[u] = collisions_final.tolist()
        # distance_all: distances from all APs to this user over time (n_aps x n_steps)
        distance_all[u] = user_dist_matrix.tolist()

    # build result dict matching MATLAB result_struct fields (but Python lists)
    result = {
        "users_sinr": sinr_all,
        "users_handover": handover_all,
        "users_throughput": throughput_all,
        "users_mac_throughput": mac_throughput_all,
        "users_per": per_all,
        "users_retries": retries_all,
        "users_collision": collisions_all,
        "users_distance": distance_all,
        "time": list(np.arange(1, n_steps + 1))
    }

    return result

# matlab_simulation.py
from mobility import generate_realistic_user_positions

def _build_aps_meta(env):
    """
    Build the aps_meta list (each entry is a dict) from env produced by build_environment.
    This matches the fields expected by the Python simulator.
    """
    n_aps = int(env["numberOfAccessPoints"])
    tx_powers = env["transmissionPowers"]
    freqs = env["frequencies"]
    bws = env["bandwidths"]
    positions = env["apPositions"]

    aps_meta = []
    for k in range(n_aps):
        ap = {
            "tx_power_dBm": float(tx_powers[k]),
            "frequency_Hz": float(freqs[k]),
            "bandwidth_Hz": float(bws[k]),
            "position": [float(positions[k][0]), float(positions[k][1])]
        }
        aps_meta.append(ap)
    return aps_meta


def _to_serializable(obj):
    """
    Recursively convert numpy types to plain Python types (int, float, list).
    """
    if isinstance(obj, np.generic):
        return obj.item()
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, list):
        return [_to_serializable(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: _to_serializable(v) for k, v in obj.items()}
    return obj


def run_multiuser_wifi_simulation(env):
    """
    Adapter used by Flask. Accepts env produced by build_environment() and returns JSON-able dict.
    Mirrors previous API shape: returns dict with users_sinr, users_handover, users_throughput, ...
    """
    # Extract parameters from env
    simulation_time = float(env["simulationTime"])
    time_step = float(env["timeStep"])
    n_steps = int(simulation_time / time_step)
    n_users = int(env["numberOfNodes"])
    ap_positions = env["apPositions"]
    velocity = float(env.get("velocity", 1.5))
    path_loss_exp = float(env.get("pathLossExponent", 3.0))
    rician_K_dB = float(env.get("ricianKFactor_dB", 5.0))
    hysteresis_dB = float(env.get("hysteresis_dB", 3.0)) if "hysteresis_dB" in env else 3.0

    # Build aps metadata expected by the Python simulator
    aps_meta = _build_aps_meta(env)

    # Generate mobility trace (n_users, 2, n_steps)
    user_positions = generate_realistic_user_positions(
        n_users=n_users,
        n_steps=n_steps,
        ap_positions=ap_positions,
        velocity=velocity,
        time_step=time_step
    )

    # Call the Python simulator (the high-fidelity port)
    result = simulate_multi_user_wifi_py(
        aps=aps_meta,
        user_positions=user_positions,
        path_loss_exp=path_loss_exp,
        rician_K_dB=rician_K_dB,
        hysteresis_dB=hysteresis_dB
    )

    # ensure JSON-serializable (lists etc).
    return _to_serializable(result)
