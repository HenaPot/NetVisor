export const AP_POSITIONS_PRESETS = [
  { label: "Triangle", positions: [[0, 0], [50, 0], [0, 50]] },
  { label: "Line", positions: [[0, 0], [25, 0], [50, 0]] },
  { label: "Custom", positions: [] }
];

export const AP_POWER_PRESETS = [
  { label: "All 23 dBm", powers: [23, 23, 23] },
  { label: "Mixed", powers: [20, 23, 25] },
  { label: "Custom", powers: [] }
];

export const AP_FREQ_PRESETS = [
  { label: "All 2.4 GHz", freqs: [2.4e9, 2.4e9, 2.4e9] },
  { label: "Mixed", freqs: [2.4e9, 2.42e9, 2.44e9] },
  { label: "Custom", freqs: [] }
];

export const AP_BANDWIDTH_PRESETS = [
  { label: "All 20 MHz", bandwidths: [20000000, 20000000, 20000000] },
  { label: "Mixed", bandwidths: [20000000, 40000000, 20000000] },
  { label: "Custom", bandwidths: [] }
];

export const AP_ANTENNA_GAIN_PRESETS = [
  { label: "All 0 dBi", gains: [0, 0, 0] },
  { label: "Custom", gains: [] }
];

export const AP_BEAMWIDTH_PRESETS = [
  { label: "All 360°", beamwidths: [360, 360, 360] },
  { label: "Custom", beamwidths: [] }
];