import { Card, CardContent, Typography, Box } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useLocation, useNavigate } from "react-router-dom";

const WirelessSimDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { snr, distance } = location.state || {};

  if (!snr || !distance) {
    // If no data, redirect back to form
    navigate("/");
    return null;
  }

  // Prepare data for chart
  const chartData = distance.map((d: number, i: number) => ({
    distance: d,
    snr: snr[i],
  }));

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 700 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            SNR over Distance
          </Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="distance" label={{ value: "Distance", position: "insideBottomRight", offset: 0 }} />
              <YAxis label={{ value: "SNR (dB)", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Line type="monotone" dataKey="snr" stroke="#1976d2" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default WirelessSimDashboard;