function connected_ap = handover_decision_with_interference(dist_matrix, aps, path_loss_exp, rician_K_dB, hysteresis_dB)
    if nargin < 5
        hysteresis_dB = 3;
    end

    [n_aps, n_steps] = size(dist_matrix);
    sinr_matrix = zeros(n_aps, n_steps);
    freq_tolerance_Hz = 1e6;

    % --- Ensure aps fields are numeric ---
    for k = 1:n_aps
        if iscell(aps(k).frequency_Hz)
            aps(k).frequency_Hz = aps(k).frequency_Hz{1};
        end
        if iscell(aps(k).tx_power_dBm)
            aps(k).tx_power_dBm = aps(k).tx_power_dBm{1};
        end
        if iscell(aps(k).bandwidth_Hz)
            aps(k).bandwidth_Hz = aps(k).bandwidth_Hz{1};
        end
    end

    for i = 1:n_aps
        intf_aps = struct('tx_power_dBm', {}, 'frequency_Hz', {}, 'bandwidth_Hz', {}, 'distances', {});
        for j = 1:n_aps
            % unwrap cells if any
            freq_i = aps(i).frequency_Hz;
            freq_j = aps(j).frequency_Hz;
            if j ~= i && abs(freq_j - freq_i) < freq_tolerance_Hz
                intf_ap = struct();
                intf_ap.tx_power_dBm = aps(j).tx_power_dBm;
                intf_ap.frequency_Hz = freq_j;
                intf_ap.bandwidth_Hz = aps(j).bandwidth_Hz;
                intf_ap.distances = dist_matrix(j, :);
                intf_aps(end+1) = intf_ap;
            end
        end

        sinr_matrix(i, :) = compute_snr_with_interference(dist_matrix(i,:), aps(i), intf_aps, path_loss_exp, rician_K_dB);
    end

    % Smooth SINR
    sinr_matrix = movmean(sinr_matrix, 3, 2);

    connected_ap = zeros(1, n_steps);
    [~, current_ap] = max(sinr_matrix(:, 1));

    for t = 1:n_steps
        current_sinr = sinr_matrix(current_ap, t);
        best_ap = current_ap;

        for ap_idx = 1:n_aps
            if ap_idx ~= current_ap
                candidate_sinr = sinr_matrix(ap_idx, t);
                if candidate_sinr > current_sinr + hysteresis_dB
                    best_ap = ap_idx;
                end
            end
        end

        current_ap = best_ap;
        connected_ap(t) = current_ap;
    end
end
