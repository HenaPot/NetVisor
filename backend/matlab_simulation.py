import matlab.engine

eng = matlab.engine.start_matlab()

def run_wifi_simulation(f_GHz, txPower_dBm):
    """
    Runs the MATLAB wifi_signal_simulation function.

    Parameters:
    - f_GHz (float): Frequency in GHz
    - txPower_dBm (float): Transmission power in dBm

    Returns:
    - List of first 5 SNR values (float)
    """
    try:
        result = eng.wifi_signal_simulation(float(f_GHz), float(txPower_dBm), nargout=3)

        distance = [val[0] for val in result[0]]  # Flatten the first output (distance)
        rx_power = [val[0] for val in result[1]]  # Flatten the second output (rxPower_dBm)
        snr = [val[0] for val in result[2]]       # Flatten the third output (SNR_dB)
        return snr[:5]
    
    except Exception as e:
        print("MATLAB simulation error:", str(e))
        return []
