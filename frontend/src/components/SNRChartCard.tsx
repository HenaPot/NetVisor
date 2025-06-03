import { Card, CardContent, Typography, Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface SNRChartCardProps {
  snr?: number[][];
  distance?: number[][];
  time?: number[];
  error?: string;
}

// Use your transform function (can be imported from a utils file)
function transformSNRdata(
  snr: number[][],
  distance: number[][],
  time: number[]
) {
  const numNodes = snr.length;
  const numTimes = time.length;

  const chartData = [];

  for (let i = 0; i < numTimes; i++) {
    const dataPoint: Record<string, number> = { time: time[i] };
    for (let nodeIdx = 0; nodeIdx < numNodes; nodeIdx++) {
      dataPoint[`snr_node${nodeIdx + 1}`] = snr[nodeIdx][i];
      dataPoint[`distance_node${nodeIdx + 1}`] = distance[nodeIdx][i];
    }
    chartData.push(dataPoint);
  }
  return chartData;
}

const COLORS = [
  "#1976d2",
  "#388e3c",
  "#f57c00",
  "#7b1fa2",
  "#d32f2f",
  "#00796b",
  "#c2185b",
  "#303f9f",
]; // Add more colors if needed

const SNRChartCard = ({ snr, distance, time, error }: SNRChartCardProps) => {
  if (error) {
    return (
      <Card sx={{ width: "100%", maxWidth: 1200, mx: "auto", boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" gutterBottom>
            Mobility-Driven Wi-Fi Simulation
          </Typography>
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!snr || !distance || !time) {
    return null; // or some placeholder/loading state
  }

  const timeChartData = transformSNRdata(snr, distance, time);
  const numNodes = snr.length;

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: 1300, // or your preferred max width
        mx: "auto",
        boxShadow: 3,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <CardContent sx={{ width: "100%" }}>
        <Typography variant="h5" align="center" gutterBottom>
          Mobility-Driven Wi-Fi Simulation
        </Typography>
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="center"
          sx={{ width: "100%", margin: 0 }}
        >
          <Grid item xs={12} md={6} {...({} as any)}>
            <Typography variant="subtitle1" align="center">
              SNR vs Time (per Node)
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%" minWidth={350}>
                <LineChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{
                      value: "Time (s)",
                      position: "insideBottomRight",
                      offset: 0,
                    }}
                  />
                  <YAxis
                    label={{
                      value: "SNR (dB)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={50} />
                  {Array.from({ length: numNodes }).map((_, idx) => (
                    <Line
                      key={`snr_node${idx + 1}`}
                      type="monotone"
                      dataKey={`snr_node${idx + 1}`}
                      stroke={COLORS[idx % COLORS.length]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} {...({} as any)}>
            <Typography variant="subtitle1" align="center">
              Distance vs Time (per Node)
            </Typography>
            <Box height={400}>
              <ResponsiveContainer width="100%" height="100%" minWidth={350}>
                <LineChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{
                      value: "Time (s)",
                      position: "insideBottomRight",
                      offset: 0,
                    }}
                  />
                  <YAxis
                    label={{
                      value: "Distance (m)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={50} />
                  {Array.from({ length: numNodes }).map((_, idx) => (
                    <Line
                      key={`distance_node${idx + 1}`}
                      type="monotone"
                      dataKey={`distance_node${idx + 1}`}
                      stroke={COLORS[idx % COLORS.length]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default SNRChartCard;
