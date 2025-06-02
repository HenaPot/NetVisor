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
import { useNavigate } from "react-router-dom";

const ENVIRONMENTS = [
  { label: "Free space (ideal, unobstructed LOS)", n: 1.0 },
  { label: "Indoor (line-of-sight, corridors, open office)", n: 1.7 },
  { label: "Urban outdoor LOS", n: 2.0 },
  { label: "Indoor (non-line-of-sight, obstructed office)", n: 3.1 },
  { label: "Urban outdoor (non-line-of-sight)", n: 4.0 },
  { label: "Dense urban / urban canyon", n: 5.0 },
  { label: "Inside buildings with heavy obstructions", n: 6.0 },
  { label: "Suburban outdoor", n: 3.0 },
  { label: "Forested / foliage-dense environments", n: 5.0 },
  { label: "Underground, tunnels, heavy industrial areas", n: 7.0 },
];

const WirelessSimInputForm = () => {
  const [formData, setFormData] = useState({
    numberOfNodes: "",
    frequency: "",
    transmissionPower: "",
    numberOfAccessPoints: "",
    distance: "",
    environmentType: "",
    pathLossExponent: 3.0, // default
  });

  const navigate = useNavigate();

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
    // Pass formData to dashboard via navigation state
    navigate("/dashboard", { state: { formData } });
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "background.default",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 500,
          mx: 2,
          boxShadow: 3,
          p: 2,
        }}
      >
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Wireless Simulation Input
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              label="Number of Nodes"
              name="numberOfNodes"
              value={formData.numberOfNodes}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              type="number"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Frequency (GHz)"
              name="frequency"
              value={formData.frequency}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              type="number"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Transmission Power (dBm)"
              name="transmissionPower"
              value={formData.transmissionPower}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              type="number"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Number of Access Points"
              name="numberOfAccessPoints"
              value={formData.numberOfAccessPoints}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              type="number"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              label="Max Distance (m)"
              name="distance"
              value={formData.distance}
              onChange={handleChange}
              fullWidth
              margin="normal"
              required
              type="number"
              onWheel={e => (e.target as HTMLInputElement).blur()}
            />
            <TextField
              select
              label="Environment Type"
              name="environmentType"
              value={formData.environmentType}
              onChange={handleEnvironmentChange}
              fullWidth
              margin="normal"
              required
            >
              {ENVIRONMENTS.map((env) => (
                <MenuItem key={env.label} value={env.label}>
                  {env.label}
                </MenuItem>
              ))}
            </TextField>
            <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
              Simulate
            </Button>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WirelessSimInputForm;

