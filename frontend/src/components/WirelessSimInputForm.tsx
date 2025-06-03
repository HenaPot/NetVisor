import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  MenuItem,
} from "@mui/material";
import { ENVIRONMENTS } from "../data/environments";

interface WirelessSimInputFormProps {
  onSubmit: (formData: Record<string, any>) => void;
}

const WirelessSimInputForm: React.FC<WirelessSimInputFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    frequency: 2.4,
    transmissionPower: 20,
    bandwidth: 20000000,
    noiseFigure: 10,
    numberOfNodes: 10,
    numberOfAccessPoints: 1,
    dataSize: 1000,
    pathLossExponent: 3.0,
    ricianKFactor_dB: 6.0,
    simulationTime: 100.0,
    timeStep: 1.0,
    velocity: 1.5,
    environmentType: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === "number" ? Number(value) : value,
    });
  };

  const handleEnvironmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = ENVIRONMENTS.find(env => env.label === e.target.value);
    setFormData({
      ...formData,
      environmentType: e.target.value,
      pathLossExponent: selected ? selected.n : 3.0,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Remove environmentType before sending, if not needed by backend
    const { environmentType, ...payload } = formData;
    onSubmit(payload);
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
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          mx: 1,
          boxShadow: 3,
          p: 1,
        }}
      >
        <CardContent>
          <Typography variant="h6" align="center" gutterBottom>
            Wireless Simulation Input
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Frequency (GHz)"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Transmission Power (dBm)"
              name="transmissionPower"
              value={formData.transmissionPower}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Bandwidth (Hz)"
              name="bandwidth"
              value={formData.bandwidth}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Noise Figure (dB)"
              name="noiseFigure"
              value={formData.noiseFigure}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Number of Nodes"
              name="numberOfNodes"
              value={formData.numberOfNodes}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Number of Access Points"
              name="numberOfAccessPoints"
              value={formData.numberOfAccessPoints}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Data Size"
              name="dataSize"
              value={formData.dataSize}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              select
              label="Environment Type"
              name="environmentType"
              value={formData.environmentType}
              onChange={handleEnvironmentChange}
              fullWidth
              margin="dense"
              required
              size="small"
            >
              {ENVIRONMENTS.map((env) => (
                <MenuItem key={env.label} value={env.label}>
                  {env.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Rician K Factor (dB)"
              name="ricianKFactor_dB"
              value={formData.ricianKFactor_dB}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Simulation Time (s)"
              name="simulationTime"
              value={formData.simulationTime}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Time Step (s)"
              name="timeStep"
              value={formData.timeStep}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Velocity (m/s)"
              name="velocity"
              value={formData.velocity}
              onChange={handleChange}
              fullWidth
              margin="dense"
              required
              type="number"
              size="small"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              size="small"
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