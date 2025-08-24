function ber = ber_qpsk(snr_linear)
    ber = qfunc(sqrt(2 * snr_linear));
end