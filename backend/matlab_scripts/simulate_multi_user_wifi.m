function result = simulate_multi_user_wifi(aps, user_positions, path_loss_exp, rician_K_dB, hysteresis_dB)
    [n_users, ~, n_steps] = size(user_positions);
    n_aps = length(aps);

    % Compute distances between each user and each AP at each time step
    dist_matrix = calculate_user_ap_distances(aps, user_positions); % [n_aps x n_users x n_steps]

    users = struct([]);
    for u = 1:n_users
        % Prepare per-user distance matrix for handover
        user_dist_matrix = squeeze(dist_matrix(:, u, :));  % [n_aps x n_steps]

        % Run handover decision logic
        handover = handover_decision_with_interference(user_dist_matrix, aps, path_loss_exp, rician_K_dB, hysteresis_dB);

        % Compute throughput and SINR for each AP for this user
        throughput_matrix = zeros(n_aps, n_steps);
        sinr_matrix = zeros(n_aps, n_steps);
        for ap_idx = 1:n_aps
            serving_ap = aps(ap_idx);
            serving_ap.distances = user_dist_matrix(ap_idx, :);

            % Build interference APs (exclude serving AP)
            intf_aps = aps(setdiff(1:n_aps, ap_idx));
            for j = 1:length(intf_aps)
                temp = user_dist_matrix(setdiff(1:n_aps, ap_idx), :);
                intf_aps(j).distances = temp(j, :);
            end

            throughput_matrix(ap_idx, :) = compute_throughput_with_mcs(user_dist_matrix(ap_idx,:), serving_ap, intf_aps, path_loss_exp, rician_K_dB);
            sinr_matrix(ap_idx, :) = compute_snr_with_interference(user_dist_matrix(ap_idx,:), serving_ap, intf_aps, path_loss_exp, rician_K_dB);
        end

        % Select throughput and SINR based on handover
        throughput_final = throughput_matrix(sub2ind(size(throughput_matrix), handover, 1:n_steps));
        sinr_final = sinr_matrix(sub2ind(size(sinr_matrix), handover, 1:n_steps));

        % Package results for Python
        users(u).sinr_matrix = sinr_matrix;
        users(u).handover = handover;
        users(u).throughput = throughput_final;
        users(u).distance_matrix = squeeze(dist_matrix(:, u, :));
        users(u).user_id = u;
    end

    result.users = users;
    result.time = 1:n_steps; % or pass your actual time vector if available
end