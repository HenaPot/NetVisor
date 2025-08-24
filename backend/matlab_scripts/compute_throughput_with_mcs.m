function throughput_bps = compute_throughput_with_mcs(distances, ap, interfering_aps, path_loss_exp, rician_K_dB)
    % IEEE 802.11 style MCS selection and throughput calculation
    
    % MCS parameters: [Modulation, Coding Rate, Data Rate (Mbps)]
    mcs_table = {
        'BPSK',  1/2,  6.5;
        'QPSK',  1/2,  13;
        'QPSK',  3/4,  19.5;
        '16QAM', 1/2,  26;
        '16QAM', 3/4,  39;
        '64QAM', 2/3,  52;
        '64QAM', 3/4,  58.5;
        '64QAM', 5/6,  65
    };
    
    % Packet parameters
    packet_length_bits = 1500 * 8; % 1500 byte packets 
    max_retries = 3;
    
    % Compute SINR
    snr_dB = compute_snr_with_interference(distances, ap, interfering_aps, path_loss_exp, rician_K_dB);
    snr_linear = 10.^(snr_dB/10);
    
    throughput_bps = zeros(size(distances));
    
    for t = 1:length(distances)
        % MCS selection based on SINR thresholds
        if snr_dB(t) < 5
            mcs_idx = 1; % BPSK 1/2
        elseif snr_dB(t) < 10
            mcs_idx = 2; % QPSK 1/2
        elseif snr_dB(t) < 15
            mcs_idx = 3; % QPSK 3/4
        elseif snr_dB(t) < 20
            mcs_idx = 4; % 16QAM 1/2
        elseif snr_dB(t) < 25
            mcs_idx = 5; % 16QAM 3/4
        elseif snr_dB(t) < 30
            mcs_idx = 6; % 64QAM 2/3
        elseif snr_dB(t) < 35
            mcs_idx = 7; % 64QAM 3/4
        else
            mcs_idx = 8; % 64QAM 5/6
        end
        
        % Get BER for selected modulation
        switch mcs_table{mcs_idx,1}
            case 'BPSK'
                ber = ber_bpsk(snr_linear(t));
            case 'QPSK'
                ber = ber_qpsk(snr_linear(t));
            case '16QAM'
                ber = ber_16qam(snr_linear(t));
            case '64QAM'
                ber = ber_64qam(snr_linear(t));
        end
        
        % Calculate PER (Packet Error Rate)
        per = 1 - exp(-ber * packet_length_bits);
        
        % Simulate transmission attempts
        success = false;
        for attempt = 1:max_retries
            if rand > per
                fprintf('Time %2d: SNR = %5.1f dB, MCS = %d (%s %0.2f), PER = %.4f, Throughput = %4.1f Mbps\n', ...
            t, snr_dB(t), mcs_idx, mcs_table{mcs_idx,1}, mcs_table{mcs_idx,2}, per, throughput_bps(t)/1e6);

                success = true;
                break;
            end
        end
        
        % Calculate throughput if successful
        if success
            % Convert MCS data rate (Mbps) to bps
            throughput_bps(t) = mcs_table{mcs_idx,3} * 1e6;
        else
            throughput_bps(t) = 0;
        end
        
        fprintf('Time %2d: SNR = %5.1f dB, MCS = %d (%s %0.2f), PER = %.4f, Throughput = %4.1f Mbps\n', ...
            t, snr_dB(t), mcs_idx, mcs_table{mcs_idx,1}, mcs_table{mcs_idx,2}, per, throughput_bps(t)/1e6);
    end
end