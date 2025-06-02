function [distance, SNR_log_dB] = wifi_signal_simulation(env)
    f = env.f_GHz * 1e9;
    txPower_dBm = env.txPower_dBm;
    bandwidth = env.bandwidth_Hz;
    noiseFigure = env.noiseFigure_dB;
    distance = env.distances;
    d0 = env.refetenceDistance_m;
    n = env.pathLossExponent;
    K = env.ricianKFactor_dB;
    
    % Convert Tx Power from dBm to linear scale (Watts)
    txPower_W = 10^((txPower_dBm - 30)/10);
    
    % Path loss calculation (in dB)
    PL0 = 20*log10(d0) + 20*log10(f) - 147.55; 
    PL_log = PL0 + 10*n*log10(distance/d0);
    
    % Received power in linear scale (Watts)
    PL_linear = 10.^(-PL_log/10);
    rxPower_W = txPower_W * PL_linear;

    % --- Rician Fading ---
    K_linear = 10^(K/10);
    s = sqrt(K_linear / (K_linear + 1)); % LOS component
    sigma = sqrt(1 / (2*(K_linear + 1))); % NLOS component
    
    % Generate complex Rician fading coefficients
    h = (s + sigma * randn(size(distance))) + 1i * (sigma * randn(size(distance)));
    fading_gain = abs(h).^2;  % Power gain (magnitude squared)
    
    % Apply fading
    rxPower_faded_W = rxPower_W .* fading_gain;
    rxPower_log_dBm = 10*log10(rxPower_faded_W) + 30;

    % Noise power in dBm
    noise_dBm = -174 + 10*log10(bandwidth) + noiseFigure;

    % Final SNR
    SNR_log_dB = rxPower_log_dBm - noise_dBm;
end
