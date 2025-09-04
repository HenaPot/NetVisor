import { Card, CardContent, Typography, Box } from "@mui/material";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Line,
} from "recharts";
import { COLORS } from "../data/colors";

interface CollisionChartCardProps {
  collision?: number[][];
  retries?: number[][];
  time?: number[];
  selectedUsers: number[];
}

const CollisionChartCard = ({ collision, retries, time, selectedUsers }: CollisionChartCardProps) => {
  if (!collision || !retries || !time) {
    return null;
  }

  const chartData = time.map((t, i) => {
    const dataPoint: any = { time: t };
    selectedUsers.forEach((userIdx) => {
      if (collision[userIdx] && collision[userIdx][i] !== undefined) {
        dataPoint[`user${userIdx + 1}_collision`] = collision[userIdx][i];
      }
      if (retries[userIdx] && retries[userIdx][i] !== undefined) {
        dataPoint[`user${userIdx + 1}_retries`] = retries[userIdx][i];
      }
    });
    return dataPoint;
  });

  return (
    <Card sx={{ boxShadow: 3, width: "100%" }}>
      <CardContent sx={{ width: "100%" }}>
        <Typography variant="h6" gutterBottom>
          Collisions and Retries
        </Typography>
        <Box height={400} sx={{ width: "100%" }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                label={{ value: "Time (s)", dy: 20, position: "insideBottomRight" }}
              />
              <YAxis
                label={{ value: "Retries", angle: -90, position: "insideLeft" }}
                yAxisId="left"
              />
              <YAxis
                orientation="right"
                yAxisId="right"
                label={{ value: "Collision", angle: -90, position: "insideRight" }}
                domain={[0, 1]}
              />
              <Tooltip />
              <Legend />
              {selectedUsers.map((userIdx, idx) => (
                <Bar
                  key={`collision-${userIdx}`}
                  yAxisId="right"
                  dataKey={`user${userIdx + 1}_collision`}
                  fill={COLORS[idx % COLORS.length]}
                  name={`User ${userIdx + 1} Collision`}
                  barSize={10}
                />
              ))}
              {selectedUsers.map((userIdx, idx) => (
                <Line
                  key={`retries-${userIdx}`}
                  yAxisId="left"
                  type="monotone"
                  dataKey={`user${userIdx + 1}_retries`}
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  name={`User ${userIdx + 1} Retries`}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Bars show collision occurrences (0 or 1), lines show retry counts.
        </Typography>
      </CardContent>
    </Card>
  );
};

export default CollisionChartCard;