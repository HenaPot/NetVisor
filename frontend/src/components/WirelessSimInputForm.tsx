import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
  IconButton,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  AP_POSITIONS_PRESETS,
  AP_POWER_PRESETS,
  AP_FREQ_PRESETS,
  AP_BANDWIDTH_PRESETS,
  AP_ANTENNA_GAIN_PRESETS,
  AP_BEAMWIDTH_PRESETS,
} from "../data/apOptions";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

interface WirelessSimInputFormProps {
  onSubmit: (formData: Record<string, any>) => void;
}

const defaultNumAPs = 3;

const arraysEqual = (a: any[], b: any[], tolerance = 0.001) => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (Array.isArray(a[i]) && Array.isArray(b[i])) {
      if (!arraysEqual(a[i], b[i], tolerance)) return false;
    } else if (Math.abs(a[i] - b[i]) > tolerance) {
      return false;
    }
  }
  return true;
};

interface FormErrors {
  numberOfNodes?: string;
  numberOfAccessPoints?: string;
  simulationTime?: string;
  timeStep?: string;
  [key: string]: string | undefined;
}

const WirelessSimInputForm: React.FC<WirelessSimInputFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    simulationTime: 30,
    timeStep: 1,
    numberOfNodes: 3,
    velocity: 1.5,
    pathLossExponent: 3.2,
    numberOfAccessPoints: defaultNumAPs,
    dataSize: 1000,
    transmissionPowers: [23, 23, 23],
    frequencies: [2.4e9, 2.4e9, 2.4e9],
    bandwidths: [20000000, 20000000, 20000000],
    apPositions: [[0, 0], [50, 0], [0, 50]],
    K0dB: 5.0,
    KDecay: 0.1,
    shadowSigmaDB: 3.0,
    maxRetries: 3,
    antennaGains: [0, 0, 0],
    beamwidths: [360, 360, 360],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [hasErrors, setHasErrors] = useState(false);

  // Track which presets should show as Custom
  const [customPresets, setCustomPresets] = useState({
    positions: false,
    power: false,
    frequency: false,
    bandwidth: false,
    antennaGain: false,
    beamwidth: false
  });

  // Validate form fields
  const validateField = (field: string, value: any): string | undefined => {
    switch (field) {
      case "numberOfNodes":
        if (value === "" || isNaN(value)) return "Number of Nodes is required";
        if (value < 1 || value > 10) return "Number of Nodes must be between 1 and 10";
        return undefined;
      case "numberOfAccessPoints":
        if (value === "" || isNaN(value)) return "Number of Access Points is required";
        if (value < 1 || value > 10) return "Number of Access Points must be between 1 and 10";
        return undefined;
      case "simulationTime":
        if (value === "" || isNaN(value)) return "Simulation Time is required";
        if (value <= 0) return "Simulation Time must be greater than 0";
        return undefined;
      case "timeStep":
        if (value === "" || isNaN(value)) return "Time Step is required";
        if (value <= 0) return "Time Step must be greater than 0";
        return undefined;
      default:
        return undefined;
    }
  };

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    // Validate numberOfNodes
    const nodesError = validateField("numberOfNodes", formData.numberOfNodes);
    if (nodesError) newErrors.numberOfNodes = nodesError;
    
    // Validate numberOfAccessPoints
    const apsError = validateField("numberOfAccessPoints", formData.numberOfAccessPoints);
    if (apsError) newErrors.numberOfAccessPoints = apsError;
    
    // Validate simulationTime
    const timeError = validateField("simulationTime", formData.simulationTime);
    if (timeError) newErrors.simulationTime = timeError;
    
    // Validate timeStep
    const timeStepError = validateField("timeStep", formData.timeStep);
    if (timeStepError) newErrors.timeStep = timeStepError;
    
    setErrors(newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    setHasErrors(!isValid);
    return isValid;
  };

  // Update hasErrors whenever formData changes
  useEffect(() => {
    validateForm();
  }, [formData]);

  // Helper to update array fields
  const handleArrayChange = (field: string, idx: number, value: any) => {
    setFormData((prev) => {
      const arr = [...(prev as any)[field]];
      arr[idx] = value === "" ? "" : Number(value);
      return { ...prev, [field]: arr };
    });
    
    // Mark this preset as custom when manually edited
    const presetKey = field === "transmissionPowers" ? "power" :
                     field === "frequencies" ? "frequency" :
                     field === "bandwidths" ? "bandwidth" :
                     field === "antennaGains" ? "antennaGain" :
                     field === "beamwidths" ? "beamwidth" : "positions";
    
    setCustomPresets(prev => ({ ...prev, [presetKey]: true }));
  };

  // Helper to update AP positions
  const handlePositionChange = (idx: number, axis: 0 | 1, value: any) => {
    setFormData((prev) => {
      const arr = [...prev.apPositions];
      arr[idx] = [...arr[idx]];
      arr[idx][axis] = value === "" ? 0 : Number(value);
      return { ...prev, apPositions: arr };
    });
    // Mark positions as custom when manually edited
    setCustomPresets(prev => ({ ...prev, positions: true }));
  };

  // Handle number of APs change
  const handleNumAPsChange = (num: number) => {
    // Validate the new number first
    const error = validateField("numberOfAccessPoints", num);
    if (error) {
      setErrors(prev => ({ ...prev, numberOfAccessPoints: error }));
    } else {
      setErrors(prev => ({ ...prev, numberOfAccessPoints: undefined }));
    }

    setFormData((prev) => {
      const updateArray = (arr: any[], def: any) =>
        Array(num)
          .fill(null)
          .map((_, i) => arr[i] !== undefined ? arr[i] : def);
      return {
        ...prev,
        numberOfAccessPoints: num,
        transmissionPowers: updateArray(prev.transmissionPowers, 23),
        frequencies: updateArray(prev.frequencies, 2.4e9),
        bandwidths: updateArray(prev.bandwidths, 20000000),
        apPositions: updateArray(prev.apPositions, [0, 0]),
        antennaGains: updateArray(prev.antennaGains, 0),
        beamwidths: updateArray(prev.beamwidths, 360),
      };
    });
    // Reset all custom flags when number of APs changes
    setCustomPresets({
      positions: false,
      power: false,
      frequency: false,
      bandwidth: false,
      antennaGain: false,
      beamwidth: false
    });
  };

  // Add/remove APs
  const addAP = () => {
    if (formData.numberOfAccessPoints < 10) {
      handleNumAPsChange(formData.numberOfAccessPoints + 1);
    }
  };
  
  const removeAP = () => {
    if (formData.numberOfAccessPoints > 1) {
      handleNumAPsChange(formData.numberOfAccessPoints - 1);
    }
  };

  // Helper for single value fields
  const handleSingleValueChange = (field: string, value: any) => {
    const numericValue = value === "" ? "" : Number(value);
    
    // Validate the field
    const error = validateField(field, numericValue);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    setFormData((prev) => ({
      ...prev,
      [field]: numericValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate the form before submission
    if (!validateForm()) {
      return;
    }

    // Convert all empty string fields to default values before submit
    const cleanedFormData: Record<string, any> = { ...formData };
    Object.keys(cleanedFormData).forEach((key) => {
      if (typeof cleanedFormData[key] === "string" && cleanedFormData[key] === "") {
        cleanedFormData[key] = 0;
      }
      if (Array.isArray(cleanedFormData[key])) {
        cleanedFormData[key] = cleanedFormData[key].map((v: any) =>
          v === "" ? 0 : v
        );
      }
      if (key === "apPositions" && Array.isArray(cleanedFormData[key])) {
        cleanedFormData[key] = cleanedFormData[key].map((pos: any[]) =>
          pos.map((v: any) => (v === "" ? 0 : v))
        );
      }
    });
    onSubmit(cleanedFormData);
  };

  // Get the current preset label for each category
  const getCurrentPresetLabel = (presets: any[], currentValues: any[], customKey: keyof typeof customPresets) => {
    if (customPresets[customKey]) {
      return "Custom";
    }
    const matchingPreset = presets.find(p => 
      p.label !== "Custom" && arraysEqual(p[Object.keys(p)[1]], currentValues)
    );
    return matchingPreset?.label || "Custom";
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "background.default",
        py: 4,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 600, mx: 1, boxShadow: 3, p: 1 }}>
        <CardContent>
          <Typography variant="h6" align="center" gutterBottom>
            NetVisor - Wireless Simulator
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6} {...({} as any)}>
                <TextField
                  label="Simulation Time (s)"
                  name="simulationTime"
                  value={formData.simulationTime}
                  onChange={e => handleSingleValueChange("simulationTime", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                  error={!!errors.simulationTime}
                  helperText={errors.simulationTime}
                  inputProps={{ min: 0.1, step: 0.1 }}
                />
                <TextField
                  label="Time Step (s)"
                  name="timeStep"
                  value={formData.timeStep}
                  onChange={e => handleSingleValueChange("timeStep", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                  error={!!errors.timeStep}
                  helperText={errors.timeStep}
                  inputProps={{ min: 0.1, step: 0.1 }}
                />
                <TextField
                  label="Number of Nodes"
                  name="numberOfNodes"
                  value={formData.numberOfNodes}
                  onChange={e => handleSingleValueChange("numberOfNodes", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                  error={!!errors.numberOfNodes}
                  helperText={errors.numberOfNodes}
                  inputProps={{ min: 1, max: 10 }}
                />
                <TextField
                  label="Velocity (m/s)"
                  name="velocity"
                  value={formData.velocity}
                  onChange={e => handleSingleValueChange("velocity", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                />
                <TextField
                  label="Path Loss Exponent"
                  name="pathLossExponent"
                  value={formData.pathLossExponent}
                  onChange={e => handleSingleValueChange("pathLossExponent", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                />
                <TextField
                  label="Data Size"
                  name="dataSize"
                  value={formData.dataSize}
                  onChange={e => handleSingleValueChange("dataSize", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                />
                <TextField
                  label="K0 (dB)"
                  name="K0dB"
                  value={formData.K0dB}
                  onChange={e => handleSingleValueChange("K0dB", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                />
                <TextField
                  label="K Decay"
                  name="KDecay"
                  value={formData.KDecay}
                  onChange={e => handleSingleValueChange("KDecay", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                />
                <TextField
                  label="Shadow Sigma (dB)"
                  name="shadowSigmaDB"
                  value={formData.shadowSigmaDB}
                  onChange={e => handleSingleValueChange("shadowSigmaDB", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                />
                <TextField
                  label="Max Retries"
                  name="maxRetries"
                  value={formData.maxRetries}
                  onChange={e => handleSingleValueChange("maxRetries", e.target.value)}
                  fullWidth
                  margin="dense"
                  required
                  type="number"
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={6} {...({} as any)}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <TextField
                    label="Number of Access Points"
                    name="numberOfAccessPoints"
                    value={formData.numberOfAccessPoints}
                    onChange={e => handleNumAPsChange(Number(e.target.value))}
                    type="number"
                    size="small"
                    sx={{ width: 180 }}
                    error={!!errors.numberOfAccessPoints}
                    helperText={errors.numberOfAccessPoints}
                    inputProps={{ min: 1, max: 10 }}
                  />
                  <IconButton 
                    onClick={addAP} 
                    size="small" 
                    sx={{ ml: 1 }}
                    disabled={formData.numberOfAccessPoints >= 10}
                  >
                    <AddIcon />
                  </IconButton>
                  <IconButton 
                    onClick={removeAP} 
                    size="small"
                    disabled={formData.numberOfAccessPoints <= 1}
                  >
                    <RemoveIcon />
                  </IconButton>
                </Box>
                <TextField
                  select
                  label="AP Positions Preset"
                  value={getCurrentPresetLabel(AP_POSITIONS_PRESETS, formData.apPositions, "positions")}
                  onChange={e => {
                    const preset = AP_POSITIONS_PRESETS.find(p => p.label === e.target.value);
                    if (preset) {
                      if (preset.label === "Custom") {
                        setCustomPresets(prev => ({ ...prev, positions: true }));
                      } else if (preset.positions.length === formData.numberOfAccessPoints) {
                        setFormData({ ...formData, apPositions: preset.positions });
                        setCustomPresets(prev => ({ ...prev, positions: false }));
                      }
                    }
                  }}
                  fullWidth
                  margin="dense"
                  size="small"
                >
                  {AP_POSITIONS_PRESETS.map(p => (
                    <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
                  ))}
                </TextField>
                {formData.apPositions.map((pos: any[], idx: number) => (
                  <Box key={idx} sx={{ display: "flex", gap: 1, mb: 2, mt: 1 }}>
                    <TextField
                      label={`AP${idx + 1} X`}
                      type="number"
                      size="small"
                      value={pos[0]}
                      onChange={e => handlePositionChange(idx, 0, e.target.value)}
                      sx={{ width: 80 }}
                    />
                    <TextField
                      label={`AP${idx + 1} Y`}
                      type="number"
                      size="small"
                      value={pos[1]}
                      onChange={e => handlePositionChange(idx, 1, e.target.value)}
                      sx={{ width: 80 }}
                    />
                  </Box>
                ))}
                <TextField
                  select
                  label="AP Power Preset"
                  value={getCurrentPresetLabel(AP_POWER_PRESETS, formData.transmissionPowers, "power")}
                  onChange={e => {
                    const preset = AP_POWER_PRESETS.find(p => p.label === e.target.value);
                    if (preset) {
                      if (preset.label === "Custom") {
                        setCustomPresets(prev => ({ ...prev, power: true }));
                      } else if (preset.powers.length === formData.numberOfAccessPoints) {
                        setFormData({ ...formData, transmissionPowers: preset.powers });
                        setCustomPresets(prev => ({ ...prev, power: false }));
                      }
                    }
                  }}
                  fullWidth
                  margin="dense"
                  size="small"
                >
                  {AP_POWER_PRESETS.map(p => (
                    <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
                  ))}
                </TextField>
                {formData.transmissionPowers.map((val: any, idx: number) => (
                  <TextField
                    key={idx}
                    label={`AP${idx + 1} Power (dBm)`}
                    type="number"
                    size="small"
                    value={val}
                    onChange={e => handleArrayChange("transmissionPowers", idx, e.target.value)}
                    sx={{ width: 120, mb: 2, mt: 1 }}
                  />
                ))}
                <TextField
                  select
                  label="AP Frequency Preset"
                  value={getCurrentPresetLabel(AP_FREQ_PRESETS, formData.frequencies, "frequency")}
                  onChange={e => {
                    const preset = AP_FREQ_PRESETS.find(p => p.label === e.target.value);
                    if (preset) {
                      if (preset.label === "Custom") {
                        setCustomPresets(prev => ({ ...prev, frequency: true }));
                      } else if (preset.freqs.length === formData.numberOfAccessPoints) {
                        setFormData({ ...formData, frequencies: preset.freqs });
                        setCustomPresets(prev => ({ ...prev, frequency: false }));
                      }
                    }
                  }}
                  fullWidth
                  margin="dense"
                  size="small"
                >
                  {AP_FREQ_PRESETS.map(p => (
                    <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
                  ))}
                </TextField>
                {formData.frequencies.map((val: any, idx: any) => (
                  <TextField
                    key={idx}
                    label={`AP${idx + 1} Freq (Hz)`}
                    type="number"
                    size="small"
                    value={val}
                    onChange={e => handleArrayChange("frequencies", idx, e.target.value)}
                    sx={{ width: 160, mb: 2, mt: 1 }}
                  />
                ))}
                <TextField
                  select
                  label="AP Bandwidth Preset"
                  value={getCurrentPresetLabel(AP_BANDWIDTH_PRESETS, formData.bandwidths, "bandwidth")}
                  onChange={e => {
                    const preset = AP_BANDWIDTH_PRESETS.find(p => p.label === e.target.value);
                    if (preset) {
                      if (preset.label === "Custom") {
                        setCustomPresets(prev => ({ ...prev, bandwidth: true }));
                      } else if (preset.bandwidths.length === formData.numberOfAccessPoints) {
                        setFormData({ ...formData, bandwidths: preset.bandwidths });
                        setCustomPresets(prev => ({ ...prev, bandwidth: false }));
                      }
                    }
                  }}
                  fullWidth
                  margin="dense"
                  size="small"
                >
                  {AP_BANDWIDTH_PRESETS.map(p => (
                    <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
                  ))}
                </TextField>
                {formData.bandwidths.map((val: any, idx: any) => (
                  <TextField
                    key={idx}
                    label={`AP${idx + 1} Bandwidth (Hz)`}
                    type="number"
                    size="small"
                    value={val}
                    onChange={e => handleArrayChange("bandwidths", idx, e.target.value)}
                    sx={{ width: 160, mb: 2, mt: 1 }}
                  />
                ))}
                <TextField
                  select
                  label="AP Antenna Gain Preset"
                  value={getCurrentPresetLabel(AP_ANTENNA_GAIN_PRESETS, formData.antennaGains, "antennaGain")}
                  onChange={e => {
                    const preset = AP_ANTENNA_GAIN_PRESETS.find(p => p.label === e.target.value);
                    if (preset) {
                      if (preset.label === "Custom") {
                        setCustomPresets(prev => ({ ...prev, antennaGain: true }));
                      } else if (preset.gains.length === formData.numberOfAccessPoints) {
                        setFormData({ ...formData, antennaGains: preset.gains });
                        setCustomPresets(prev => ({ ...prev, antennaGain: false }));
                      }
                    }
                  }}
                  fullWidth
                  margin="dense"
                  size="small"
                >
                  {AP_ANTENNA_GAIN_PRESETS.map(p => (
                    <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
                  ))}
                </TextField>
                {formData.antennaGains.map((val: any, idx: any) => (
                  <TextField
                    key={idx}
                    label={`AP${idx + 1} Antenna Gain (dBi)`}
                    type="number"
                    size="small"
                    value={val}
                    onChange={e => handleArrayChange("antennaGains", idx, e.target.value)}
                    sx={{ width: 120, mb: 2, mt: 1 }}
                  />
                ))}
                <TextField
                  select
                  label="AP Beamwidth Preset"
                  value={getCurrentPresetLabel(AP_BEAMWIDTH_PRESETS, formData.beamwidths, "beamwidth")}
                  onChange={e => {
                    const preset = AP_BEAMWIDTH_PRESETS.find(p => p.label === e.target.value);
                    if (preset) {
                      if (preset.label === "Custom") {
                        setCustomPresets(prev => ({ ...prev, beamwidth: true }));
                      } else if (preset.beamwidths.length === formData.numberOfAccessPoints) {
                        setFormData({ ...formData, beamwidths: preset.beamwidths });
                        setCustomPresets(prev => ({ ...prev, beamwidth: false }));
                      }
                    }
                  }}
                  fullWidth
                  margin="dense"
                  size="small"
                >
                  {AP_BEAMWIDTH_PRESETS.map(p => (
                    <MenuItem key={p.label} value={p.label}>{p.label}</MenuItem>
                  ))}
                </TextField>
                {formData.beamwidths.map((val: any, idx: any) => (
                  <TextField
                    key={idx}
                    label={`AP${idx + 1} Beamwidth (deg)`}
                    type="number"
                    size="small"
                    value={val}
                    onChange={e => handleArrayChange("beamwidths", idx, e.target.value)}
                    sx={{ width: 120, mb: 2, mt: 1 }}
                  />
                ))}
              </Grid>
            </Grid>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              size="large"
              disabled={hasErrors}
            >
              Simulate
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WirelessSimInputForm;