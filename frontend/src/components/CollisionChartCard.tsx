import { Card, CardContent, Typography, Box } from "@mui/material";
import {
  BarChart,
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

interface CollisionChartCardProps {
  collision?: number[][];
  retries?: number[][];
  time?: number[];
}

const COLORS = ["#d32f2f", "#7b1fa2", "#00796b"];

const CollisionChartCard = ({ collision, retries, time }: CollisionChartCardProps) => {
  if (!collision || !retries || !time) {
    return null;
  }

  const chartData = time.map((t, i) => {
    const dataPoint: any = { time: t };
    collision.forEach((userCollision, userIdx) => {
      dataPoint[`user${userIdx + 1}_collision`] = userCollision[i];
    });
    retries.forEach((userRetries, userIdx) => {
      dataPoint[`user${userIdx + 1}_retries`] = userRetries[i];
    });
    return dataPoint;
  });

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Collisions and Retries
        </Typography>
        <Box height={400}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" label={{ value: "Time (s)", position: "insideBottomRight" }} />
              <YAxis 
                label={{ value: "Count", angle: -90, position: "insideLeft" }}
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
              {collision.map((_, idx) => (
                <Bar
                  key={`collision-${idx}`}
                  yAxisId="right"
                  dataKey={`user${idx + 1}_collision`}
                  fill={COLORS[idx]}
                  name={`User ${idx + 1} Collision`}
                  barSize={10}
                />
              ))}
              {retries.map((_, idx) => (
                <Line
                  key={`retries-${idx}`}
                  yAxisId="left"
                  type="monotone"
                  dataKey={`user${idx + 1}_retries`}
                  stroke={COLORS[idx]}
                  strokeWidth={2}
                  dot={false}
                  name={`User ${idx + 1} Retries`}
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