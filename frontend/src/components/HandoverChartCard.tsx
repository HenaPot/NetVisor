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
  numberOfAPs?: number; 
  selectedUsers: number[];
}

const HandoverChartCard = ({
  handover,
  time,
  numberOfAPs = 3,
  selectedUsers,
}: HandoverChartCardProps) => {
  if (!handover || !time) {
    return null;
  }

  const chartData = time.map((t, i) => {
    const dataPoint: any = { time: t };
    selectedUsers.forEach((userIdx) => {
      if (handover[userIdx] && handover[userIdx][i] !== undefined) {
        dataPoint[`user${userIdx + 1}`] = handover[userIdx][i];
      }
    });
    return dataPoint;
  });

  const yAxisTicks = Array.from({ length: numberOfAPs }, (_, i) => i + 1);

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
              <XAxis
                dataKey="time"
                label={{ value: "Time (s)", dy: 20, position: "insideBottomRight" }}
              />
              <YAxis
                label={{ value: "AP ID", angle: -90, position: "insideLeft" }}
                domain={[0.5, numberOfAPs + 0.5]}
                ticks={yAxisTicks}
              />
              <Tooltip />
              <Legend />
              {selectedUsers.map((userIdx, idx) => (
                <Line
                  key={`handover-${userIdx}`}
                  type="stepAfter"
                  dataKey={`user${userIdx + 1}`}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ fill: COLORS[idx % COLORS.length], r: 4 }}
                  activeDot={{ r: 6 }}
                  name={`User ${userIdx + 1} AP`}
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