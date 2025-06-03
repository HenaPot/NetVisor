import { Box, CircularProgress, Typography } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import SNRChartCard from "../components/SNRChartCard";
import { useEffect, useState } from "react";
import EnvironmentSidebar from "../components/EnvironmentSidebar";

const WirelessSimDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData } = location.state || {};

  const [result, setResult] = useState<{ snr?: number[][]; distance?: number[][]; time?: number[]; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!formData) {
      navigate("/");
      return;
    }
    setLoading(true);
    fetch("http://localhost:5000/api/simulation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    })
      .then((response) => response.json())
      .then((data) => setResult(data))
      .catch((error) => setResult({ error: error.message }))
      .finally(() => setLoading(false));
  }, [formData, navigate]);

  if (!formData) return null;

  return (
    <>
      <EnvironmentSidebar formData={formData} />
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center", // vertical centering
          alignItems: "center",     // horizontal centering
          backgroundColor: "background.default",
          px: 2,
          py: 4,
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 1400, mx: "auto" }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", height: 400, justifyContent: "center" }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Running simulation...</Typography>
            </Box>
          ) : (
          <SNRChartCard snr={result?.snr} distance={result?.distance} time={result?.time} error={result?.error} />
          )}
        </Box>
      </Box>
    </>
  );
};

export default WirelessSimDashboard;
