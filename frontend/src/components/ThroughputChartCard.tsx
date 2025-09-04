import { Card, CardContent, Typography, Box } from "@mui/material";
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
import { COLORS } from "../data/colors";

interface ThroughputChartCardProps {
  throughput?: number[][];
  macThroughput?: number[][];
  time?: number[];
}

const formatThroughput = (value: number) => {
  return `${(value / 1e6).toFixed(2)} Mbps`;
};

const ThroughputChartCard = ({ throughput, macThroughput, time }: ThroughputChartCardProps) => {
  if (!throughput || !macThroughput || !time) {
    return null;
  }

  const chartData = time.map((t, i) => {
    const dataPoint: any = { time: t };
    throughput.forEach((userThroughput, userIdx) => {
      dataPoint[`user${userIdx + 1}_throughput`] = userThroughput[i];
    });
    macThroughput.forEach((userMacThroughput, userIdx) => {
      dataPoint[`user${userIdx + 1}_mac`] = userMacThroughput[i];
    });
    return dataPoint;
  });

  return (
    <Card sx={{ boxShadow: 3, width: "100%" }}>
      <CardContent sx={{ width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Throughput Analysis
        </Typography>
        <Box height={400} sx={{ width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: "Time (s)", dy: 20, position: "insideBottomRight" }} />
              <YAxis 
                label={{ value: "Throughput", angle: -90, position: "insideLeft" }}
                tickFormatter={formatThroughput}
              />
              <Tooltip formatter={(value) => formatThroughput(value as number)} />
              <Legend />
              {throughput.map((_, idx) => (
                <Line
                  key={`throughput-${idx}`}
                  type="monotone"
                  dataKey={`user${idx + 1}_throughput`}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={false}
                  name={`User ${idx + 1} Throughput`}
                />
              ))}
              {macThroughput.map((_, idx) => (
                <Line
                  key={`mac-${idx}`}
                  type="monotone"
                  dataKey={`user${idx + 1}_mac`}
                  stroke={COLORS[idx]}
                  strokeDasharray="5 5"
                  dot={false}
                  name={`User ${idx + 1} MAC Throughput`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Solid lines show application throughput, dashed lines show MAC layer throughput.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default ThroughputChartCard;