function ber = ber_bpsk(snr_linear)
    ber = qfunc(sqrt(2 * snr_linear));
end