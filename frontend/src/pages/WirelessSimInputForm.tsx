import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
} from "@mui/material";

const WirelessSimInputForm = () => {
  const [formData, setFormData] = useState({
    numberOfNodes: "",
    frequency: "",
    dataSize: "",
    transmissionPower: "",
    numberOfAccessPoints: "",
    distance: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
    // Send to backend or MATLAB integration here
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 500 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Wireless Simulation Input
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              fullWidth
              size="small"
              variant="standard"
              label="Number of Nodes"
              name="numberOfNodes"
              type="text"
              value={formData.numberOfNodes}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              variant="standard"
              fullWidth
              label="Frequency (Hz)"
              name="frequency"
              type="text"
              value={formData.frequency}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              variant="standard"
              fullWidth
              label="Data Size (bytes)"
              name="dataSize"
              type="text"
              value={formData.dataSize}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              variant="standard"
              fullWidth
              label="Transmission Power (dBm)"
              name="transmissionPower"
              type="text"
              value={formData.transmissionPower}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              variant="standard"
              fullWidth
              label="Number of Access Points"
              name="numberOfAccessPoints"
              type="text"
              value={formData.numberOfAccessPoints}
              onChange={handleChange}
              margin="normal"
              required
            />
            <TextField
              variant="standard"
              fullWidth
              label="Distance / Geolocation Info"
              name="distance"
              type="text"
              value={formData.distance}
              onChange={handleChange}
              margin="normal"
              required
            />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }}>
              Submit
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WirelessSimInputForm;
