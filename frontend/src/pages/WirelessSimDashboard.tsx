import { Box, CircularProgress, Typography, Grid, IconButton, } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EnvironmentSidebar from "../components/EnvironmentSidebar";
import SINRChartCard from "../components/SINRChartCard";
import ThroughputChartCard from "../components/ThroughputChartCard";
import HandoverChartCard from "../components/HandoverChartCard";
import PERChartCard from "../components/PERChartCard";
import CollisionChartCard from "../components/CollisionChartCard";

interface SimulationResult {
  time: number[];
  users_collision: number[][];
  users_distance: number[][][];
  users_handover: number[][];
  users_mac_throughput: number[][];
  users_per: number[][];
  users_retries: number[][];
  users_sinr: number[][][];
  users_throughput: number[][];
  error?: string;
}

const WirelessSimDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData } = location.state || {};

  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (!formData) {
      navigate("/");
      return;
    }
    setLoading(true);
    fetch(`${API_URL}/api/simulation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => setResult(data))
      .catch((error) => setResult({ 
        error: error.message,
        time: [],
        users_collision: [],
        users_distance: [],
        users_handover: [],
        users_mac_throughput: [],
        users_per: [],
        users_retries: [],
        users_sinr: [],
        users_throughput: []
      }))
      .finally(() => setLoading(false));
  }, [formData, navigate]);

  if (!formData) return null;

  return (
    <>
      <EnvironmentSidebar formData={formData} />
      <IconButton 
        onClick={() => navigate(-1)} 
        sx={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: (theme) => theme.zIndex.drawer + 2, 
          backgroundColor: "background.paper",
          boxShadow: 2,
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
        aria-label="go back"
      >
        <ArrowBackIcon />
      </IconButton>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "background.default",
          px: 2,
          py: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: "100%", mx: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", height: 400, justifyContent: "center" }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Running simulation...</Typography>
            </Box>
          ) : result ? (
            <Grid container direction="column" spacing={3} sx={{ width: "100%", margin: 0 }}>
              <Grid item xs={12} {...({} as any)}>
                <SINRChartCard 
                  sinr={result.users_sinr} 
                  distance={result.users_distance} 
                  time={result.time} 
                  error={result.error} 
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <ThroughputChartCard 
                  throughput={result.users_throughput} 
                  macThroughput={result.users_mac_throughput}
                  time={result.time} 
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <PERChartCard 
                  per={result.users_per} 
                  time={result.time} 
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <HandoverChartCard 
                  handover={result.users_handover} 
                  time={result.time} 
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <CollisionChartCard 
                  collision={result.users_collision} 
                  retries={result.users_retries}
                  time={result.time} 
                />
              </Grid>
            </Grid>
          ) : (
            <Typography>No simulation results available</Typography>
          )}
        </Box>
      </Box>
    </>
  );
};

export default WirelessSimDashboard;
