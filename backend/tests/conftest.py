import numpy as np
import pytest

@pytest.fixture(autouse=True)
def _fixed_seed():
    """
    Make all tests deterministic by fixing numpy RNG.
    """
    np.random.seed(123)

@pytest.fixture
def simple_aps_meta():
    """
    Two APs, slightly different frequencies and same bandwidths.
    Positions are separated so path loss differs by user location.
    """
    return [
        {
            "tx_power_dBm": 20.0,
            "frequency_Hz": 5.18e9,   # ch 36-ish
            "bandwidth_Hz": 20e6,
            "position": [0.0, 0.0],
            "antenna_gain_dBi": 0.0,
            "beamwidth_deg": 360.0,
        },
        {
            "tx_power_dBm": 20.0,
            "frequency_Hz": 5.22e9,   # adjacent-ish
            "bandwidth_Hz": 20e6,
            "position": [10.0, 0.0],
            "antenna_gain_dBi": 0.0,
            "beamwidth_deg": 360.0,
        },
    ]

@pytest.fixture
def simple_distances():
    """
    Distances for 2 APs over 5 time steps (shape (n_aps, n_steps)).
    User moves from near AP1 toward AP2.
    """
    # AP1 distances shrink then grow a bit; AP2 distances grow then shrink
    ap1 = np.array([2.0, 2.5, 3.0, 6.0, 9.0])
    ap2 = np.array([9.0, 6.0, 3.5, 2.5, 2.0])
    return np.vstack([ap1, ap2])

@pytest.fixture
def simple_user_positions():
    """
    User positions (shape (2, n_steps)) used only for directional gain path,
    but here antenna gains are 0 so effect is neutral; still good for shape.
    """
    xs = np.linspace(0.0, 10.0, 5)
    ys = np.zeros(5)
    return np.vstack([xs, ys])
