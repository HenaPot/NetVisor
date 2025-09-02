import numpy as np
from scipy.stats import norm
from backend.mobility import generate_realistic_user_positions


def interference_factor(freq_diff_Hz, channel_bandwidth_Hz):
    """
    Returns a linear interference factor between 0 and 1 based on frequency separation.
    freq_diff_Hz: absolute frequency difference
    channel_bandwidth_Hz: AP channel bandwidth
    """
    if freq_diff_Hz == 0:
        return 1.0  # fully co-channel
    elif freq_diff_Hz < channel_bandwidth_Hz:
        # Adjacent channel interference drops linearly with separation
        return 1 - freq_diff_Hz / channel_bandwidth_Hz
    else:
        return 0.0


# --- Enhanced fading + path loss ---
def rician_fading_with_shadowing(distances, K0_dB=5.0, K_decay=0.1, shadow_sigma_dB=3.0):
    """
    distances : array_like
        Distance from APs (meters)
    K0_dB : float
        Rician K-factor at reference distance (dB)
    K_decay : float
        Exponential decay factor for K vs distance
    shadow_sigma_dB : float
        Standard deviation for log-normal shadowing (dB)
    """
    # Distance-dependent K-factor
    K_dB = K0_dB * np.exp(-K_decay * distances)
    K_linear = 10 ** (K_dB / 10)

    # Rician parameters
    s = np.sqrt(K_linear / (K_linear + 1))
    sigma = np.sqrt(1 / (2 * (K_linear + 1)))

    # Small-scale fading (Rician)
    fading_real = s + sigma * np.random.randn(*distances.shape)
    fading_imag = sigma * np.random.randn(*distances.shape)
    fading_linear = fading_real**2 + fading_imag**2

    # Log-normal shadowing (in linear scale)
    shadow_dB = np.random.randn(*distances.shape) * shadow_sigma_dB
    shadow_linear = 10 ** (shadow_dB / 10)

    return fading_linear * shadow_linear


# --- Received power ---
def compute_received_power(distances, ap, path_loss_exp=3.0,
                                    K0_dB=5.0, K_decay=0.1, shadow_sigma_dB=3.0):
    """
    Compute received power (linear scale) with:
    - Distance-dependent Rician fading
    - Log-normal shadowing
    - Path loss
    """
    freq_Hz = ap["frequency_Hz"]
    tx_power_dBm = ap["tx_power_dBm"]
    c = 3e8
    lambda_c = c / freq_Hz
    d0 = 1.0  # reference distance

    # Free-space path loss at d0
    pl_d0 = 20 * np.log10(4*np.pi*d0 / lambda_c)

    # Path loss over distance
    path_loss_dB = pl_d0 + 10 * path_loss_exp * np.log10(distances/d0 + 1e-12)

    # Combined fading + shadowing
    fading_linear = rician_fading_with_shadowing(distances, K0_dB, K_decay, shadow_sigma_dB)
    fading_dB = 10 * np.log10(fading_linear + 1e-12)

    # Received power in dBm and convert to linear scale
    rx_power_dBm = tx_power_dBm - path_loss_dB + fading_dB
    rx_power_linear = 10 ** (rx_power_dBm / 10)

    return rx_power_linear


# --- BER functions ---
ber_map = {
    "BPSK": lambda snr: norm.sf(np.sqrt(2*snr)),
    "QPSK": lambda snr: norm.sf(np.sqrt(2*snr)),
    "16QAM": lambda snr: 3/8 * norm.sf(np.sqrt(4/5*snr)),
    "64QAM": lambda snr: 7/24 * norm.sf(np.sqrt(6/7*snr)),
}


# --- Directional antenna gain ---
def directional_gain(theta_rad, G_max_dBi=0, theta_3dB_deg=360):
    """
    Simple 2D azimuthal antenna gain.
    """
    theta_deg = np.degrees(theta_rad) % 360
    # Cosine pattern: 0 deg -> max gain, drops at half-power beamwidth
    G_dB = G_max_dBi * np.cos(np.pi/2 * theta_deg / theta_3dB_deg)
    G_dB = np.clip(G_dB, -20, G_max_dBi)  # limit back lobe
    return 10 ** (G_dB / 10)


# --- Angle between AP and user ---
def angle_to_user(ap_pos, user_pos):
    dx, dy = user_pos[0] - ap_pos[0], user_pos[1] - ap_pos[1]
    return np.arctan2(dy, dx)


# --- SINR computation ---
def compute_sinr(distances_all_aps, aps_meta,
                 path_loss_exp=3.0, K0_dB=5.0, K_decay=0.1, shadow_sigma_dB=3.0,
                 user_positions=None):
    """
    distances_all_aps: shape (n_aps, n_steps)
    user_positions: shape (2, n_steps)
    """
    n_aps, n_steps = distances_all_aps.shape
    rx_all = np.zeros((n_aps, n_aps, n_steps))

    # Compute received power including directional gain
    for i, ap in enumerate(aps_meta):
        for j, intf_ap in enumerate(aps_meta):
            rx_lin = compute_received_power(
                distances_all_aps[j,:],
                intf_ap,
                path_loss_exp=path_loss_exp,
                K0_dB=K0_dB,
                K_decay=K_decay,
                shadow_sigma_dB=shadow_sigma_dB
            )

            # Apply directional gain per timestep if user positions provided
            if user_positions is not None:
                gain_lin = np.ones(n_steps)
                for t in range(n_steps):
                    theta = angle_to_user(intf_ap["position"], user_positions[:,t])
                    gain_lin[t] = directional_gain(
                        theta,
                        G_max_dBi=intf_ap.get("antenna_gain_dBi",0),
                        theta_3dB_deg=intf_ap.get("beamwidth_deg",360)
                    )
                rx_lin *= gain_lin

            rx_all[i,j,:] = rx_lin

    # Compute SINR considering frequency-dependent interference
    sinr_linear = np.zeros((n_aps, n_steps))
    for i, ap in enumerate(aps_meta):
        serving_power = rx_all[i,i,:]
        interference_power = np.zeros(n_steps)
        for j, intf_ap in enumerate(aps_meta):
            if j == i:
                continue
            freq_diff = abs(intf_ap["frequency_Hz"] - ap["frequency_Hz"])
            intf_factor = interference_factor(freq_diff, ap["bandwidth_Hz"])
            interference_power += rx_all[i,j,:] * intf_factor

        # Noise power in linear scale (dBm -> linear)
        noise_power_dBm = -174 + 10*np.log10(ap["bandwidth_Hz"]) + 7
        noise_power = 10 ** (noise_power_dBm / 10)

        sinr_linear[i,:] = serving_power / (interference_power + noise_power + 1e-12)

    return sinr_linear


# --- Handover ---
def handover_decision(sinr_dB_matrix, hysteresis_dB=3.0):
    n_aps, n_steps = sinr_dB_matrix.shape
    connected_ap = np.zeros(n_steps, dtype=int)
    current_ap = np.argmax(sinr_dB_matrix[:,0])
    for t in range(n_steps):
        current_sinr = sinr_dB_matrix[current_ap,t]
        candidates = np.where(sinr_dB_matrix[:,t] > current_sinr + hysteresis_dB)[0]
        if candidates.size > 0:
            current_ap = candidates[np.argmax(sinr_dB_matrix[candidates,t])]
        connected_ap[t] = current_ap
    return connected_ap + 1


# --- Full throughput computation with adaptive MCS per user ---
def compute_throughput_all(
    sinr_linear_all,
    n_users_on_ap,
    packet_size_bytes=1500,
    max_retries=3,
    mcs_table=None,
    mcs_thresholds=None,
):
    """
    Compute PHY and MAC throughput with adaptive MCS per-user and frequency-aware SINR.
    """

    n_aps, n_steps = sinr_linear_all.shape
    packet_bits = packet_size_bytes * 8

    # Default MCS table
    if mcs_table is None:
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

    # Default MCS thresholds (dB)
    if mcs_thresholds is None:
        mcs_thresholds = [5, 10, 15, 20, 25, 30, 35]

    # Ensure n_users_on_ap is broadcast correctly
    n_users_on_ap = np.atleast_2d(n_users_on_ap)
    if n_users_on_ap.shape[1] == 1 and n_users_on_ap.shape[0] == n_aps:
        n_users_on_ap = np.repeat(n_users_on_ap, n_steps, axis=1)

    # Adaptive MCS selection per user
    snr_dB = 10 * np.log10(sinr_linear_all + 1e-12)
    mcs_idx = np.digitize(snr_dB, bins=mcs_thresholds)
    mcs_idx = np.clip(mcs_idx, 0, len(mcs_table) - 1)

    # PHY rates and modulation types
    phy_rates = np.array([mcs_table[idx][2]*1e6 for idx in mcs_idx.flatten()]).reshape(n_aps, n_steps)
    mod_types = np.array([mcs_table[idx][0] for idx in mcs_idx.flatten()]).reshape(n_aps, n_steps)

    # BER calculation per modulation type
    ber_vals = np.zeros_like(snr_dB)
    for mod, ber_func in ber_map.items():
        mask = (mod_types == mod)
        if np.any(mask):
            ber_vals[mask] = ber_func(sinr_linear_all[mask])

    # Packet error rate (PER)
    per = 1 - np.exp(-ber_vals * packet_bits)

    # Retry simulation
    rand_matrix = np.random.rand(n_aps, n_steps, max_retries)
    success_mask = rand_matrix > per[:, :, None]
    first_success = np.argmax(success_mask, axis=2)
    never_succeed = ~np.any(success_mask, axis=2)
    retries = first_success.astype(float)
    retries[never_succeed] = max_retries
    collisions = never_succeed.astype(float)

    # Throughput (PHY layer)
    throughput_bps = np.where(never_succeed, 0, phy_rates)

    # MAC efficiency
    mac_efficiency = 1 / np.maximum(1, n_users_on_ap)
    mac_throughput_bps = throughput_bps * mac_efficiency

    return throughput_bps, mac_throughput_bps, per, retries, collisions


# --- Full simulation ---
def simulate_multi_user_wifi_py(
    aps,
    user_positions,
    path_loss_exp,
    K0_dB,
    K_decay,
    shadow_sigma_dB,
    hysteresis_dB,
    packet_size_bytes,
    max_retries
):
    """
    Simulate multi-user WiFi network with per-user, per-AP adaptive MCS.
    """
    n_users, _, n_steps = user_positions.shape
    n_aps = len(aps)
    ap_positions = np.array([ap["position"] for ap in aps])
    
    # Compute distances: shape (n_aps, n_users, n_steps)
    diffs = user_positions[None,:,:,:] - ap_positions[:,None,:,None]
    dist_matrix = np.sqrt(np.sum(diffs**2, axis=2))

    # Pre-allocate results
    handover_all = np.zeros((n_users, n_steps), dtype=int)
    sinr_matrix_all = np.zeros((n_users, n_aps, n_steps))

    # Compute SINR and handover per user
    for u in range(n_users):
        distances_user = dist_matrix[:, u, :]
        sinr_linear = compute_sinr(
            distances_user,
            aps,
            path_loss_exp=path_loss_exp,
            K0_dB=K0_dB,
            K_decay=K_decay,
            shadow_sigma_dB=shadow_sigma_dB,
            user_positions=user_positions[u, :, :]
        )
        sinr_dB = 10*np.log10(sinr_linear + 1e-12)
        handover_all[u, :] = handover_decision(sinr_dB, hysteresis_dB)
        sinr_matrix_all[u, :, :] = sinr_dB

    # Users per AP per timestep
    n_users_on_ap = np.zeros((n_aps, n_steps), dtype=int)
    for t in range(n_steps):
        bins, counts = np.unique(handover_all[:, t], return_counts=True)
        n_users_on_ap[bins-1, t] = counts

    # Compute throughput and other metrics for all users with per-user adaptive MCS
    throughput_all, mac_all, per_all = [], [], []
    retries_all, collisions_all, sinr_all, distance_all = [], [], [], []

    for u in range(n_users):
        # Per-user serving AP
        serving_ap_idx = handover_all[u, :] - 1  # 0-based index
        sinr_linear_user = 10**(sinr_matrix_all[u,:,:] / 10)

        # Prepare per-user SINR matrix to feed compute_throughput_all
        sinr_per_user = sinr_linear_user[serving_ap_idx, np.arange(n_steps)]

        # We need shape (1, n_steps) for compute_throughput_all
        sinr_per_user = sinr_per_user.reshape(1, n_steps)

        # Compute per-user throughput with adaptive MCS
        thr, mac, per, retries, coll = compute_throughput_all(
            sinr_per_user,
            n_users_on_ap[serving_ap_idx, np.arange(n_steps)].reshape(1, n_steps),
            packet_size_bytes=packet_size_bytes,
            max_retries=max_retries
        )

        throughput_all.append(thr.flatten().tolist())
        mac_all.append(mac.flatten().tolist())
        per_all.append(per.flatten().tolist())
        retries_all.append(retries.flatten().tolist())
        collisions_all.append(coll.flatten().tolist())
        sinr_all.append(sinr_matrix_all[u,:,:].tolist())
        distance_all.append(dist_matrix[:,u,:].tolist())

    return {
        "users_sinr": sinr_all,
        "users_handover": handover_all.tolist(),
        "users_throughput": throughput_all,
        "users_mac_throughput": mac_all,
        "users_per": per_all,
        "users_retries": retries_all,
        "users_collision": collisions_all,
        "users_distance": distance_all,
        "time": list(range(1, n_steps+1))
    }


# --- APS meta builder ---
def _build_aps_meta(env):
    n_aps = int(env["numberOfAccessPoints"])
    tx_powers = env["transmissionPowers"]
    freqs = env["frequencies"]
    bws = env["bandwidths"]
    positions = env["apPositions"]
    antenna_gains = env.get("antennaGains", [0]*n_aps)        # in dBi
    beamwidths = env.get("beamwidths", [360]*n_aps)           # in degrees
    aps_meta = []
    for k in range(n_aps):
        aps_meta.append({
            "tx_power_dBm": float(tx_powers[k]),
            "frequency_Hz": float(freqs[k]),
            "bandwidth_Hz": float(bws[k]),
            "position": [float(positions[k][0]), float(positions[k][1])],
            "antenna_gain_dBi": float(antenna_gains[k]),
            "beamwidth_deg": float(beamwidths[k])
        })
    return aps_meta


# --- Convert numpy types to JSON-serializable ---
def _to_serializable(obj):
    if isinstance(obj, np.generic):
        return obj.item()
    elif isinstance(obj, np.ndarray):
        return obj.tolist()
    elif isinstance(obj, list):
        return [_to_serializable(x) for x in obj]
    elif isinstance(obj, dict):
        return {k: _to_serializable(v) for k, v in obj.items()}
    return obj

# --- Flask adapter ---
def run_multiuser_wifi_simulation(env):
    simulation_time = float(env["simulationTime"])
    time_step = float(env["timeStep"])
    n_steps = int(simulation_time / time_step)
    n_users = int(env["numberOfNodes"])
    ap_positions = env["apPositions"]
    velocity = float(env.get("velocity", 1.5))
    path_loss_exp = float(env.get("pathLossExponent", 3.0))
    hysteresis_dB = float(env.get("hysteresis_dB", 3.0))
    K0_dB = float(env.get("K0dB", 5.0))
    K_decay = float(env.get("KDecay", 0.1))
    shadow_sigma_dB = float(env.get("shadowSigmaDB", 3.0))
    packet_size_bytes = float(env.get("dataSize", 1500))
    max_retries = int(env.get("maxRetries", 3))         

    aps_meta = _build_aps_meta(env)
    
    user_positions = generate_realistic_user_positions(
        n_users=n_users,
        n_steps=n_steps,
        ap_positions=ap_positions,
        velocity=velocity,
        time_step=time_step
    )
    
    result = simulate_multi_user_wifi_py(
        aps=aps_meta,
        user_positions=user_positions,
        path_loss_exp=path_loss_exp,
        K0_dB=K0_dB,
        K_decay=K_decay,
        shadow_sigma_dB=shadow_sigma_dB,
        hysteresis_dB=hysteresis_dB,
        packet_size_bytes=packet_size_bytes,
        max_retries=max_retries
    )
    
    return _to_serializable(result)
