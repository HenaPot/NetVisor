function result = simulate_multi_user_wifi(aps, user_positions, path_loss_exp, rician_K_dB, hysteresis_dB)
    if nargin < 5
        hysteresis_dB = 3;
    end

    [n_users, ~, n_steps] = size(user_positions);

    % --- Convert aps dict from Python to MATLAB struct array ---
    n_aps = length(aps.tx_power_dBm);
    aps_array = repmat(struct('tx_power_dBm', [], 'frequency_Hz', [], 'bandwidth_Hz', [], 'distances', [], 'position', []), 1, n_aps);
    for k = 1:n_aps
        aps_array(k).tx_power_dBm = aps.tx_power_dBm(k);
        % unwrap cell if necessary
        if iscell(aps.position{k})
            aps_array(k).position = aps.position{k}{1};
        else
            aps_array(k).position = aps.position{k};
        end
        aps_array(k).frequency_Hz = aps.frequency_Hz(k);
        aps_array(k).bandwidth_Hz = aps.bandwidth_Hz(k);
    end
    aps = aps_array;

    % Compute distance matrix
    dist_matrix = calculate_user_ap_distances(aps, user_positions); % [n_aps x n_users x n_steps]

    % --- Run simulation per user ---
    users = struct([]);
    for u = 1:n_users
        user_dist_matrix = squeeze(dist_matrix(:, u, :));  % [n_aps x n_steps]

        % Compute handover decisions
        handover = handover_decision_with_interference(user_dist_matrix, aps, path_loss_exp, rician_K_dB, hysteresis_dB);

        % Compute throughput and SINR
        throughput_matrix = zeros(n_aps, n_steps);
        sinr_matrix = zeros(n_aps, n_steps);

        for ap_idx = 1:n_aps
            serving_ap = aps(ap_idx);
            serving_ap.distances = user_dist_matrix(ap_idx, :);

            % Build interfering APs
            intf_aps = struct('tx_power_dBm', {}, 'frequency_Hz', {}, 'bandwidth_Hz', {}, 'distances', {});
            for j = 1:n_aps
                if j ~= ap_idx
                    intf_ap = struct();
                    intf_ap.tx_power_dBm = aps(j).tx_power_dBm;
                    intf_ap.frequency_Hz = aps(j).frequency_Hz;
                    intf_ap.bandwidth_Hz = aps(j).bandwidth_Hz;
                    intf_ap.distances = user_dist_matrix(j, :);
                    intf_aps(end+1) = intf_ap;
                end
            end

            throughput_matrix(ap_idx, :) = compute_throughput_with_mcs(user_dist_matrix(ap_idx,:), serving_ap, intf_aps, path_loss_exp, rician_K_dB);
            sinr_matrix(ap_idx, :) = compute_snr_with_interference(user_dist_matrix(ap_idx,:), serving_ap, intf_aps, path_loss_exp, rician_K_dB);
        end

        throughput_final = throughput_matrix(sub2ind(size(throughput_matrix), handover, 1:n_steps));
        sinr_final = sinr_matrix(sub2ind(size(sinr_matrix), handover, 1:n_steps));

        % Package results
        users(u).sinr_matrix = sinr_matrix;
        users(u).handover = handover;
        users(u).throughput = throughput_final;
        users(u).distance_matrix = squeeze(dist_matrix(:, u, :));
        users(u).user_id = u;
    end

    result.users = users;
    result.time = 1:n_steps;
end
