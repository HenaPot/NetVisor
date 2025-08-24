function ber = ber_64qam(snr_linear)
    ber = 7/24 * qfunc(sqrt((6/7) * snr_linear));
end