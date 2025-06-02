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
    numberOfNodes: "",
    frequency: "",
    transmissionPower: "",
    numberOfAccessPoints: "",
    distance: "",
    environmentType: "",
    pathLossExponent: 3.0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
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
    onSubmit(formData);
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
              label="Max Distance (m)"
              name="distance"
              value={formData.distance}
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