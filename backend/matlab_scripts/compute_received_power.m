function rx_power = compute_received_power(distances, ap, path_loss_exp, rician_K_dB)
    % Helper function to compute received power in linear scale
    c = 3e8;
    lambda = c / ap.frequency_Hz;
    d0 = 1;
    
    % Free-space path loss at reference distance
    pl_d0 = 20 * log10(4 * pi * d0 / lambda);
    
    % Log-distance path loss
    path_loss_dB = pl_d0 + 10 * path_loss_exp * log10(distances / d0 + eps);
    
    % Rician fading
    K_linear = 10^(rician_K_dB / 10);
    s = sqrt(K_linear / (K_linear + 1));
    sigma = sqrt(1 / (2 * (K_linear + 1)));
    
    % Generate Rician fading
    fading_real = s + sigma * randn(size(distances));
    fading_imag = sigma * randn(size(distances));
    fading_linear = fading_real.^2 + fading_imag.^2;
    fading_dB = 10 * log10(fading_linear + eps);
    
    % Received power in dBm
    rx_power_dBm = ap.tx_power_dBm - path_loss_dB + fading_dB;
    
    % Convert to linear scale (mW)
    rx_power = 10.^(rx_power_dBm/10);
end