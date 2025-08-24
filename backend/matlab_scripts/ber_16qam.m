function ber = ber_16qam(snr_linear)
    ber = 3/8 * qfunc(sqrt((4/5) * snr_linear));
end