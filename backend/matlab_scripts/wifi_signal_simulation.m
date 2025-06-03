mobilityData = load('node_positions.mat');
node_positions = mobilityData.node_positions;   % [numNodes × 2 × timeSteps]
time_vector = mobilityData.time_vector;

function [SNR_dB_over_time, distances_over_time] = wifi_signal_simulation_with_mobility(env, node_positions)
    % Extract parameters
    f = env.f_GHz * 1e9;
    txPower_dBm = env.txPower_dBm;
    bandwidth = env.bandwidth_Hz;
    noiseFigure = env.noiseFigure_dB;
    d0 = env.refetenceDistance_m;
    n = env.pathLossExponent;
    K_dB = env.ricianKFactor_dB;

    % Convert Tx Power from dBm to Watts
    txPower_W = 10^((txPower_dBm - 30)/10);

    % Precompute constants
    PL0 = 20*log10(d0) + 20*log10(f) - 147.55;
    noise_dBm = -174 + 10*log10(bandwidth) + noiseFigure;
    K_linear = 10^(K_dB/10);
    s = sqrt(K_linear / (K_linear + 1));   % LOS component
    sigma = sqrt(1 / (2*(K_linear + 1)));  % NLOS component

    % Dimensions
    [numNodes, ~, numTimeSteps] = size(node_positions);

    % Preallocate
    distances_over_time = zeros(numNodes, numTimeSteps);
    SNR_dB_over_time = zeros(numNodes, numTimeSteps);

    % AP at origin
    AP_position = [0; 0];

    for t = 1:numTimeSteps
        for node = 1:numNodes
            pos = squeeze(node_positions(node, :, t))';
            d = norm(pos - AP_position);

            if d < d0
                d = d0;
            end

            % Path loss
            PL_dB = PL0 + 10 * n * log10(d / d0);
            PL_linear = 10^(-PL_dB / 10);

            % Received power
            rxPower_W = txPower_W * PL_linear;

            % Rician fading
            h = (s + sigma * randn) + 1i * (sigma * randn);
            fading_gain = abs(h)^2;

            % Apply fading
            rxPower_faded_W = rxPower_W * fading_gain;
            rxPower_log_dBm = 10 * log10(rxPower_faded_W) + 30;

            % SNR
            SNR_dB_over_time(node, t) = rxPower_log_dBm - noise_dBm;
            distances_over_time(node, t) = d;
        end
    end
end
