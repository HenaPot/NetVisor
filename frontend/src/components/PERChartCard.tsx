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

interface PERChartCardProps {
  per?: number[][];
  time?: number[];
}

const PERChartCard = ({ per, time }: PERChartCardProps) => {
  if (!per || !time) {
    return null;
  }

  const chartData = time.map((t, i) => {
    const dataPoint: any = { time: t };
    per.forEach((userPer, userIdx) => {
      dataPoint[`user${userIdx + 1}`] = userPer[i];
    });
    return dataPoint;
  });

  return (
    <Card sx={{ boxShadow: 3, width: "100%" }}>
      <CardContent sx={{ width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Packet Error Rate (PER)
        </Typography>
        <Box height={400} sx={{ width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottomRight" }} />
              <YAxis 
                label={{ value: "PER", angle: -90, position: "insideLeft" }}
                domain={[0, 1]}
              />
              <Tooltip formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`} />
              <Legend />
              {per.map((_, idx) => (
                <Line
                  key={`per-${idx}`}
                  type="monotone"
                  dataKey={`user${idx + 1}`}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={false}
                  name={`User ${idx + 1} PER`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Higher PER values indicate more packet errors affecting communication quality.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PERChartCard;