import { Card, CardContent, Typography, Box } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface SNRChartCardProps {
  snr?: number[];
  distance?: number[];
  error?: string;
}

const SNRChartCard = ({ snr, distance, error }: SNRChartCardProps) => {
  let chartData: { distance: number; snr: number }[] = [];
  if (snr && distance) {
    chartData = distance.map((d, i) => ({
      distance: d,
      snr: snr[i],
    }));
  }

  return (
    <Card sx={{ width: "100%", maxWidth: 700, mx: "auto", boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h5" align="center" gutterBottom>
          SNR over Distance
        </Typography>
        <Box sx={{ height: 400, display: "flex", justifyContent: "center", alignItems: "center" }}>
          {error ? (
            <Typography color="error" variant="h6" align="center">
              {error}
            </Typography>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="distance" label={{ value: "Distance", position: "insideBottomRight", offset: 0 }} />
                <YAxis label={{ value: "SNR (dB)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Line type="monotone" dataKey="snr" stroke="#1976d2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default SNRChartCard;
