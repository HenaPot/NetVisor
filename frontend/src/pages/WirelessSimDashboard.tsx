import { Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import SNRChartCard from "../components/SNRChartCard";

const WirelessSimDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { snr, distance, error } = location.state || {};

  if (!snr && !distance && !error) {
    navigate("/");
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "background.default",
        px: 2,
      }}
    >
      <Box sx={{ width: { xs: "100%", md: "50%" } }}>
        <SNRChartCard snr={snr} distance={distance} error={error} />
      </Box>
    </Box>
  );
};

export default WirelessSimDashboard;