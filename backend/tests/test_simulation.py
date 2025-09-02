import numpy as np
from backend import core_simulation as ws


def test_interference_factor_basic():
    bw = 20e6
    # co-channel
    assert ws.interference_factor(0, bw) == 1.0
    # half-bandwidth separation -> 0.5
    assert np.isclose(ws.interference_factor(10e6, bw), 0.5)
    # beyond bandwidth -> 0
    assert ws.interference_factor(25e6, bw) == 0.0


def test_directional_gain_limits_and_symmetry():
    # With G_max_dBi=6 and very wide beamwidth, forward angle should be max
    g0 = ws.directional_gain(0.0, G_max_dBi=6, theta_3dB_deg=360)
    # 180 degrees away should be attenuated, but not below -20 dB clip
    g180 = ws.directional_gain(np.deg2rad(180), G_max_dBi=6, theta_3dB_deg=360)
    assert g0 >= g180
    # Returns positive linear gains
    assert g0 > 0 and g180 > 0
    # Bounded by 10^(Gmax/10) on top
    assert g0 <= 10 ** (6/10)


def test_angle_to_user_quadrants():
    ap = (0.0, 0.0)
    assert np.isclose(ws.angle_to_user(ap, (1, 0)), 0.0)
    assert np.isclose(ws.angle_to_user(ap, (0, 1)), np.pi/2)
    assert np.isclose(ws.angle_to_user(ap, (-1, 0)), np.pi, atol=1e-9)
    assert np.isclose(ws.angle_to_user(ap, (0, -1)), -np.pi/2)


def test_rician_fading_with_shadowing_shape_and_positivity():
    d = np.array([1.0, 2.0, 5.0])
    f = ws.rician_fading_with_shadowing(d)
    assert f.shape == d.shape
    assert np.all(f > 0)  # linear scale, positive


def test_compute_received_power_monotonic_trend():
    ap = {
        "tx_power_dBm": 20.0,
        "frequency_Hz": 5.18e9,
    }
    d_near = np.array([1.0, 2.0, 3.0])
    d_far  = np.array([10.0, 12.0, 15.0])

    p_near = ws.compute_received_power(d_near, ap)
    p_far  = ws.compute_received_power(d_far, ap)

    assert p_near.shape == d_near.shape
    assert p_far.shape == d_far.shape
    # On average, power should be higher when closer (random fading exists,
    # so compare average)
    assert np.mean(p_near) > np.mean(p_far)


def test_compute_sinr_shapes(simple_distances, simple_aps_meta, simple_user_positions):
    sinr_lin = ws.compute_sinr(
        distances_all_aps=simple_distances,
        aps_meta=simple_aps_meta,
        user_positions=simple_user_positions
    )
    n_aps, n_steps = simple_distances.shape
    assert sinr_lin.shape == (n_aps, n_steps)
    assert np.all(sinr_lin > 0)  # SINR linear is positive


def test_handover_decision_reasonable(simple_distances, simple_aps_meta, simple_user_positions):
    # Compute SINR in dB
    sinr_lin = ws.compute_sinr(
        distances_all_aps=simple_distances,
        aps_meta=simple_aps_meta,
        user_positions=simple_user_positions
    )
    sinr_db = 10 * np.log10(sinr_lin + 1e-12)

    # Expect at least one AP change given the user moves from AP1 to AP2
    conn = ws.handover_decision(sinr_db, hysteresis_dB=3.0)
    assert conn.shape[0] == sinr_db.shape[1]
    # Should be AP indices starting at 1
    assert set(np.unique(conn)).issubset({1, 2})
    # Likely at least one handover occurs
    assert np.any(conn[:-1] != conn[1:])


def test_compute_throughput_all_shapes_and_effect_of_users():
    # Single AP over 6 steps with increasing SNRs (linear)
    sinr_lin = np.array([np.linspace(1.0, 100.0, 6)])  # shape (1, 6)
    # With more users, MAC throughput should be smaller
    n_users_one = np.ones((1, 6)) * 1
    n_users_four = np.ones((1, 6)) * 4

    thr1, mac1, per1, retries1, coll1 = ws.compute_throughput_all(
        sinr_lin, n_users_one
    )
    thr4, mac4, per4, retries4, coll4 = ws.compute_throughput_all(
        sinr_lin, n_users_four
    )

    # Shapes
    for arr in (thr1, mac1, per1, retries1, coll1, thr4, mac4, per4, retries4, coll4):
        assert arr.shape == (1, 6)

    # MAC lower when more users share medium
    assert np.mean(mac4) < np.mean(mac1)

    # PER should generally decrease as SNR grows
    assert per1[0, 0] > per1[0, -1]


def test__build_aps_meta_happy_path():
    env = {
        "numberOfAccessPoints": 2,
        "transmissionPowers": [20, 18],
        "frequencies": [5.18e9, 5.22e9],
        "bandwidths": [20e6, 40e6],
        "apPositions": [[0, 0], [10, 0]],
        "antennaGains": [3, 0],
        "beamwidths": [120, 360],
    }
    aps = ws._build_aps_meta(env)
    assert len(aps) == 2
    assert isinstance(aps[0]["tx_power_dBm"], float)
    assert aps[0]["position"] == [0.0, 0.0]
    assert aps[1]["bandwidth_Hz"] == 40e6


def test__to_serializable_converts_numpy():
    obj = {
        "a": np.array([1, 2, 3]),
        "b": np.float64(1.5),
        "c": [np.int32(2), {"z": np.array([[1, 2]])}],
    }
    out = ws._to_serializable(obj)
    # Must be plain Python types
    assert isinstance(out["a"], list)
    assert isinstance(out["b"], float)
    assert isinstance(out["c"][0], int)
    assert isinstance(out["c"][1]["z"], list)


def test_run_multiuser_wifi_simulation_minimal(monkeypatch):
    """
    End-to-end smoke test that:
    - Mocks generate_realistic_user_positions (to avoid randomness and speed)
    - Checks presence/shape of core outputs
    """
    # Prepare a deterministic fake mobility
    def fake_positions(n_users, n_steps, ap_positions, velocity, time_step):
        # Straight line motion per user along x with small offsets on y
        xs = np.linspace(0, 10, n_steps)
        users = []
        for u in range(n_users):
            ys = np.full(n_steps, 0.5 * u)
            users.append(np.vstack([xs, ys]))
        return np.stack(users, axis=0)  # (n_users, 2, n_steps)

    # Patch the symbol imported in wifi_sim
    monkeypatch.setattr(ws, "generate_realistic_user_positions", fake_positions, raising=True)

    env = {
        "simulationTime": 5.0,
        "timeStep": 1.0,
        "numberOfNodes": 2,
        "numberOfAccessPoints": 2,
        "apPositions": [[0.0, 0.0], [10.0, 0.0]],
        "transmissionPowers": [20, 20],
        "frequencies": [5.18e9, 5.22e9],
        "bandwidths": [20e6, 20e6],
        "velocity": 1.5,
        "pathLossExponent": 3.0,
        "hysteresis_dB": 3.0,
        "K0dB": 5.0,
        "KDecay": 0.1,
        "shadowSigmaDB": 3.0,
        "dataSize": 1500,
        "maxRetries": 3,
    }

    result = ws.run_multiuser_wifi_simulation(env)

    # Basic contract checks
    for key in [
        "users_sinr",
        "users_handover",
        "users_throughput",
        "users_mac_throughput",
        "users_per",
        "users_retries",
        "users_collision",
        "users_distance",
        "time",
    ]:
        assert key in result

    # Shapes and sizes
    n_steps = int(env["simulationTime"] / env["timeStep"])
    n_users = env["numberOfNodes"]
    n_aps = env["numberOfAccessPoints"]

    assert len(result["time"]) == n_steps
    assert len(result["users_handover"]) == n_users
    assert len(result["users_throughput"]) == n_users
    assert len(result["users_mac_throughput"]) == n_users
    assert len(result["users_per"]) == n_users

    # Per-user arrays have length n_steps
    assert len(result["users_throughput"][0]) == n_steps
    assert len(result["users_per"][0]) == n_steps

    # SINR matrix per user: (n_aps, n_steps)
    assert np.array(result["users_sinr"][0]).shape == (n_aps, n_steps)

    # Distances per user: (n_aps, n_steps)
    assert np.array(result["users_distance"][0]).shape == (n_aps, n_steps)
