import numpy as np
from scipy.stats import norm
from mobility import generate_realistic_user_positions

# --- Fading helper ---
def rician_fading(distances, K_dB):
    K_linear = 10 ** (K_dB / 10)
    s = np.sqrt(K_linear / (K_linear + 1))
    sigma = np.sqrt(1 / (2 * (K_linear + 1)))
    fading_real = s + sigma * np.random.randn(*distances.shape)
    fading_imag = sigma * np.random.randn(*distances.shape)
    return fading_real**2 + fading_imag**2

# --- BER functions ---
ber_map = {
    "BPSK": lambda snr: norm.sf(np.sqrt(2*snr)),
    "QPSK": lambda snr: norm.sf(np.sqrt(2*snr)),
    "16QAM": lambda snr: 3/8 * norm.sf(np.sqrt(4/5*snr)),
    "64QAM": lambda snr: 7/24 * norm.sf(np.sqrt(6/7*snr)),
}

# --- Received power ---
def compute_received_power(distances, ap, path_loss_exp, rician_K_dB):
    freq_Hz = ap["frequency_Hz"]
    tx_power_dBm = ap["tx_power_dBm"]
    c = 3e8
    lambda_c = c / freq_Hz
    d0 = 1.0
    pl_d0 = 20 * np.log10(4*np.pi*d0 / lambda_c)
    path_loss_dB = pl_d0 + 10 * path_loss_exp * np.log10(distances/d0 + 1e-12)
    fading_linear = rician_fading(distances, rician_K_dB)
    fading_dB = 10*np.log10(fading_linear + 1e-12)
    rx_power_dBm = tx_power_dBm - path_loss_dB + fading_dB
    return 10 ** (rx_power_dBm / 10)

# --- SINR computation ---
def compute_sinr(distances_all_aps, aps_meta, path_loss_exp, rician_K_dB):
    n_aps, n_steps = distances_all_aps.shape
    rx_all = np.zeros((n_aps, n_aps, n_steps))
    for i, ap in enumerate(aps_meta):
        for j, intf_ap in enumerate(aps_meta):
            rx_all[i,j,:] = compute_received_power(distances_all_aps[j,:], intf_ap, path_loss_exp, rician_K_dB)
    sinr_linear = np.zeros((n_aps, n_steps))
    for i, ap in enumerate(aps_meta):
        freq = ap["frequency_Hz"]
        serving_power = rx_all[i,i,:]
        intf_mask = np.array([j != i and abs(aps_meta[j]["frequency_Hz"] - freq)<1e6 for j in range(n_aps)])
        interference_power = rx_all[i,intf_mask,:].sum(axis=0)
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

# --- Vectorized throughput computation for all APs and timesteps ---
def compute_throughput_all(sinr_linear_all, n_users_on_ap):
    n_aps, n_steps = sinr_linear_all.shape
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
    packet_bits = 1500*8
    max_retries = 3

    snr_dB = 10*np.log10(sinr_linear_all + 1e-12)
    mcs_idx = np.digitize(snr_dB, bins=[5,10,15,20,25,30,35])
    phy_rates = np.array([mcs_table[idx][2]*1e6 for idx in mcs_idx.flatten()]).reshape(n_aps, n_steps)
    mod_types = np.array([mcs_table[idx][0] for idx in mcs_idx.flatten()]).reshape(n_aps, n_steps)
    
    ber_vals = np.zeros_like(snr_dB)
    for mod in ["BPSK","QPSK","16QAM","64QAM"]:
        mask = (mod_types == mod)
        ber_vals[mask] = ber_map[mod](sinr_linear_all[mask])
    per = 1 - np.exp(-ber_vals * packet_bits)

    # Vectorized retry simulation
    rand_matrix = np.random.rand(n_aps, n_steps, max_retries)
    success_mask = rand_matrix > per[:,:,None]
    first_success = np.argmax(success_mask, axis=2)
    never_succeed = ~np.any(success_mask, axis=2)
    retries = first_success.astype(float)
    retries[never_succeed] = max_retries
    collisions = never_succeed.astype(float)
    throughput_bps = np.where(never_succeed, 0, phy_rates)
    mac_efficiency = 1 / np.maximum(1, n_users_on_ap)
    mac_throughput_bps = throughput_bps * mac_efficiency

    return throughput_bps, mac_throughput_bps, per, retries, collisions

# --- Full simulation ---
def simulate_multi_user_wifi_py(aps, user_positions, path_loss_exp, rician_K_dB, hysteresis_dB=3.0):
    n_users, _, n_steps = user_positions.shape
    n_aps = len(aps)
    ap_positions = np.array([ap["position"] for ap in aps])
    
    diffs = user_positions[None,:,:,:] - ap_positions[:,None,:,None]
    dist_matrix = np.sqrt(np.sum(diffs**2, axis=2))
    
    handover_all = np.zeros((n_users, n_steps), dtype=int)
    sinr_matrix_all = np.zeros((n_users, n_aps, n_steps))
    
    # Compute SINR and handover per user
    for u in range(n_users):
        distances_user = dist_matrix[:,u,:]
        sinr_linear = compute_sinr(distances_user, aps, path_loss_exp, rician_K_dB)
        sinr_dB = 10*np.log10(sinr_linear + 1e-12)
        handover_all[u,:] = handover_decision(sinr_dB, hysteresis_dB)
        sinr_matrix_all[u,:,:] = sinr_dB
    
    # Users per AP per timestep
    n_users_on_ap = np.zeros((n_aps, n_steps), dtype=int)
    for t in range(n_steps):
        bins, counts = np.unique(handover_all[:, t], return_counts=True)
        n_users_on_ap[bins-1, t] = counts
    
    # Compute throughput for all users in vectorized form
    throughput_all, mac_all, per_all = [], [], []
    retries_all, collisions_all, sinr_all, distance_all = [], [], [], []
    
    for u in range(n_users):
        sinr_linear = 10**(sinr_matrix_all[u,:,:] / 10)
        thr, mac, per, retries, coll = compute_throughput_all(sinr_linear, n_users_on_ap)
        h0 = handover_all[u,:] - 1
        idx_time = np.arange(n_steps)
        throughput_all.append(thr[h0, idx_time].tolist())
        mac_all.append(mac[h0, idx_time].tolist())
        per_all.append(per[h0, idx_time].tolist())
        retries_all.append(retries[h0, idx_time].tolist())
        collisions_all.append(coll[h0, idx_time].tolist())
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
    aps_meta = []
    for k in range(n_aps):
        aps_meta.append({
            "tx_power_dBm": float(tx_powers[k]),
            "frequency_Hz": float(freqs[k]),
            "bandwidth_Hz": float(bws[k]),
            "position": [float(positions[k][0]), float(positions[k][1])]
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
    rician_K_dB = float(env.get("ricianKFactor_dB", 5.0))
    hysteresis_dB = float(env.get("hysteresis_dB", 3.0))
    
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
        rician_K_dB=rician_K_dB,
        hysteresis_dB=hysteresis_dB
    )
    
    return _to_serializable(result)
