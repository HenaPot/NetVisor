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

interface HandoverChartCardProps {
  handover?: number[][];
  time?: number[];
}

const HandoverChartCard = ({ handover, time }: HandoverChartCardProps) => {
  if (!handover || !time) {
    return null;
  }

  const chartData = time.map((t, i) => {
    const dataPoint: any = { time: t };
    handover.forEach((userHandover, userIdx) => {
      dataPoint[`user${userIdx + 1}`] = userHandover[i];
    });
    return dataPoint;
  });

  return (
    <Card sx={{ boxShadow: 3, width: "100%" }}>
      <CardContent sx={{ width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          AP Handovers
        </Typography>
        <Box height={400} sx={{ width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottomRight" }} />
              <YAxis 
                label={{ value: "AP ID", angle: -90, position: "insideLeft" }}
                domain={[0, 4]}
                ticks={[1, 2, 3]}
              />
              <Tooltip />
              <Legend />
              {handover.map((_, idx) => (
                <Line
                  key={`handover-${idx}`}
                  type="stepAfter"
                  dataKey={`user${idx + 1}`}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[idx], r: 4 }}
                  activeDot={{ r: 6 }}
                  name={`User ${idx + 1} AP`}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Shows which Access Point each user is connected to over time. Changes indicate handovers.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default HandoverChartCard;