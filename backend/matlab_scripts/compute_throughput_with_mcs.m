function [throughput_bps, mac_throughput_bps, per, retries, collision_flag] = compute_throughput_with_mcs(distances, ap, interfering_aps, path_loss_exp, rician_K_dB, n_users_on_ap)
    % Existing MCS table, BER calculation...
    mcs_table = {
        'BPSK', 1/2, 6.5;
        'QPSK', 1/2, 13;
        'QPSK', 3/4, 19.5;
        '16QAM', 1/2, 26;
        '16QAM', 3/4, 39;
        '64QAM', 2/3, 52;
        '64QAM', 3/4, 58.5;
        '64QAM', 5/6, 65
    };

    packet_length_bits = 1500*8;
    max_retries = 3;

    snr_dB = compute_snr_with_interference(distances, ap, interfering_aps, path_loss_exp, rician_K_dB);
    snr_linear = 10.^(snr_dB/10);

    n_steps = length(distances);
    throughput_bps = zeros(1, n_steps);
    mac_throughput_bps = zeros(1, n_steps);
    per = zeros(1, n_steps);
    retries = zeros(1, n_steps);
    collision_flag = zeros(1, n_steps);

    % MAC efficiency approximation (naive CSMA/CA)
    mac_efficiency = 1 ./ max(1, n_users_on_ap);  % n_users_on_ap >=1

    for t = 1:n_steps
        % --- PHY throughput based on SINR ---
        if snr_dB(t) < 5
            mcs_idx = 1;
        elseif snr_dB(t) < 10
            mcs_idx = 2;
        elseif snr_dB(t) < 15
            mcs_idx = 3;
        elseif snr_dB(t) < 20
            mcs_idx = 4;
        elseif snr_dB(t) < 25
            mcs_idx = 5;
        elseif snr_dB(t) < 30
            mcs_idx = 6;
        elseif snr_dB(t) < 35
            mcs_idx = 7;
        else
            mcs_idx = 8;
        end

        switch mcs_table{mcs_idx,1}
            case 'BPSK', ber_val = ber_bpsk(snr_linear(t));
            case 'QPSK', ber_val = ber_qpsk(snr_linear(t));
            case '16QAM', ber_val = ber_16qam(snr_linear(t));
            case '64QAM', ber_val = ber_64qam(snr_linear(t));
        end

        per(t) = 1 - exp(-ber_val * packet_length_bits);

        % --- Simulate retries ---
        success = false;
        for r = 1:max_retries
            if rand > per(t)
                success = true;
                retries(t) = r-1;
                break;
            end
        end

        if ~success
            retries(t) = max_retries;
            collision_flag(t) = 1; % count as collision
        end

        % PHY throughput
        if success
            throughput_bps(t) = mcs_table{mcs_idx,3}*1e6;
        else
            throughput_bps(t) = 0;
        end

        % MAC throughput after contention
        mac_throughput_bps(t) = throughput_bps(t) * mac_efficiency(t);
    end
end
