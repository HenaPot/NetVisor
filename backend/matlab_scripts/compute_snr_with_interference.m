function snr_dB = compute_snr_with_interference(distances, ap, interfering_aps, path_loss_exp, rician_K_dB)
    % Computes SNR with co-channel interference
    % distances - to serving AP
    % interfering_aps - struct array with same fields as 'ap' plus .distances
    
    % Calculate desired signal power
    desired_power = compute_received_power(distances, ap, path_loss_exp, rician_K_dB);
    
    % Calculate interference power from co-channel APs only
    interference_power = 0;

    freq_tolerance_Hz = 1e6; % Optional: 1 MHz tolerance (for real-world WiFi channel overlap)

    for i = 1:length(interfering_aps)
        % Only include co-channel interferers
        if abs(interfering_aps(i).frequency_Hz - ap.frequency_Hz) < freq_tolerance_Hz
            intf_power = compute_received_power(interfering_aps(i).distances, interfering_aps(i), path_loss_exp, rician_K_dB);
            interference_power = interference_power + intf_power;
        end
    end
    
    % Calculate noise power (thermal noise + receiver noise figure)
    noise_power_dBm = -174 + 10*log10(ap.bandwidth_Hz) + 7; % 7 dB noise figure
    noise_power = 10^(noise_power_dBm/10);
    
    % SINR calculation
    sinr_linear = desired_power ./ (interference_power + noise_power);
    snr_dB = 10*log10(sinr_linear);
end