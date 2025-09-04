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
  selectedUsers: number[];
  selectedAPs: number[];
}

function transformSINRdata(
  sinr: number[][][],
  distance: number[][][],
  time: number[],
  selectedUsers: number[],
  selectedAPs: number[]
) {
  const numTimes = time.length;
  const chartData: Record<string, number>[] = [];

  for (let t = 0; t < numTimes; t++) {
    const dataPoint: Record<string, number> = { time: time[t] };

    selectedUsers.forEach((userIdx) => {
      let bestSinr = -Infinity;
      let bestDistance = 0;

      // Only consider selected APs for this user
      selectedAPs.forEach((apIdx) => {
        const value = sinr[userIdx]?.[apIdx]?.[t];
        if (value !== undefined && value > bestSinr) {
          bestSinr = value;
          bestDistance = distance[userIdx]?.[apIdx]?.[t] ?? 0;
        }
      });

      if (bestSinr !== -Infinity) {
        dataPoint[`sinr_user${userIdx + 1}`] = bestSinr;
        dataPoint[`distance_user${userIdx + 1}`] = bestDistance;
      }
    });

    chartData.push(dataPoint);
  }

  return chartData;
}

const SINRChartCard = ({
  sinr,
  distance,
  time,
  error,
  selectedUsers,
  selectedAPs,
}: SINRChartCardProps) => {
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

  const timeChartData = transformSINRdata(
    sinr,
    distance,
    time,
    selectedUsers,
    selectedAPs
  );

  return (
    <Card sx={{ boxShadow: 3, width: "100%" }}>
      <CardContent sx={{ width: "100%" }}>
        <Typography variant="h5" align="center" gutterBottom>
          NetVisor Connectivity Analysis
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
                      dy: 20,
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
                  {selectedUsers.map((userIdx, i) => (
                    <Line
                      key={`sinr_user${userIdx + 1}`}
                      type="monotone"
                      dataKey={`sinr_user${userIdx + 1}`}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      name={`User ${userIdx + 1} SINR`}
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
                      dy: 20,
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
                  {selectedUsers.map((userIdx, i) => (
                    <Line
                      key={`distance_user${userIdx + 1}`}
                      type="monotone"
                      dataKey={`distance_user${userIdx + 1}`}
                      stroke={COLORS[i % COLORS.length]}
                      dot={false}
                      name={`User ${userIdx + 1} Distance`}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Grid>
        </Grid>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          SINR (Signal-to-Interference-plus-Noise Ratio) and distance to the
          best Access Point for each selected user.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SINRChartCard;