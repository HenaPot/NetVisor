import { Card, CardContent, Typography, Box } from "@mui/material";
import Grid from "@mui/material/Grid";
import { COLORS } from "../data/colors";
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

interface SINRChartCardProps {
  sinr?: number[][][];
  distance?: number[][][];
  time?: number[];
  error?: string;
}

function transformSINRdata(
  sinr: number[][][],
  distance: number[][][],
  time: number[]
) {
  const numUsers = sinr.length;
  const numAPs = sinr[0].length;
  const numTimes = time.length;

  const chartData = [];

  for (let i = 0; i < numTimes; i++) {
    const dataPoint: Record<string, number> = { time: time[i] };
    
    for (let userIdx = 0; userIdx < numUsers; userIdx++) {
      // Find the best SINR across all APs for this user at this time
      let bestSinr = -Infinity;
      let bestDistance = 0;
      
      for (let apIdx = 0; apIdx < numAPs; apIdx++) {
        if (sinr[userIdx][apIdx][i] > bestSinr) {
          bestSinr = sinr[userIdx][apIdx][i];
          bestDistance = distance[userIdx][apIdx][i];
        }
      }
      
      dataPoint[`sinr_user${userIdx + 1}`] = bestSinr;
      dataPoint[`distance_user${userIdx + 1}`] = bestDistance;
    }
    chartData.push(dataPoint);
  }
  return chartData;
}

const SINRChartCard = ({ sinr, distance, time, error }: SINRChartCardProps) => {
  if (error) {
    return (
      <Card sx={{ width: "100%", boxShadow: 3 }}>
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

  if (!sinr || !distance || !time) {
    return null;
  }

  const timeChartData = transformSINRdata(sinr, distance, time);
  const numUsers = sinr.length;

  return (
    <Card sx={{ boxShadow: 3, width: "100%" }}>
      <CardContent sx={{ width: "100%" }}>
        <Typography variant="h5" align="center" gutterBottom>
          Connectivity Analysis
        </Typography>
        <Grid container spacing={3} sx={{ width: "100%", margin: 0 }}>
          <Grid item xs={12} md={6} sx={{ width: "100%" }} {...({} as any)}>
            <Typography variant="subtitle1" align="center">
              SINR vs Time
            </Typography>
            <Box height={400} sx={{ width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{
                      value: "Time (s)",
                      position: "insideBottomRight",
                    }}
                  />
                  <YAxis
                    label={{
                      value: "SINR (dB)",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip />
                  <Legend />
                  {Array.from({ length: numUsers }).map((_, idx) => (
                    <Line
                      key={`sinr_user${idx + 1}`}
                      type="monotone"
                      dataKey={`sinr_user${idx + 1}`}
                      stroke={COLORS[idx % COLORS.length]}
                      dot={false}
                      name={`User ${idx + 1} SINR`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>

          <Grid item xs={12} md={6} sx={{ width: "100%" }} {...({} as any)}>
            <Typography variant="subtitle1" align="center">
              Distance vs Time
            </Typography>
            <Box height={400} sx={{ width: "100%" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    label={{
                      value: "Time (s)",
                      position: "insideBottomRight",
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
                  <Legend />
                  {Array.from({ length: numUsers }).map((_, idx) => (
                    <Line
                      key={`distance_user${idx + 1}`}
                      type="monotone"
                      dataKey={`distance_user${idx + 1}`}
                      stroke={COLORS[idx % COLORS.length]}
                      dot={false}
                      name={`User ${idx + 1} Distance`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          SINR (Signal-to-Interference-plus-Noise Ratio) and distance to the best Access Point for each user.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SINRChartCard;