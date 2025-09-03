// pages/WirelessSimDashboard.tsx
import { Box, CircularProgress, Typography, Grid, IconButton, Alert, Button } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
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
  const { formData, savedResult, isHistorical, simulationId: incomingSimulationId } = location.state || {};
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulationId, setSimulationId] = useState(incomingSimulationId || "");
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  
  // Use refs to track if we've already made the API call
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate a unique ID for this simulation
  const generateSimulationId = () => {
    return `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get the most recent historical result to check if we're viewing the current simulation
  const getMostRecentHistoryItem = () => {
    const savedHistory = localStorage.getItem("simulationHistory");
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        return history.length > 0 ? history[0] : null;
      } catch (error) {
        console.error("Error parsing simulation history:", error);
      }
    }
    return null;
  };

  useEffect(() => {
    if (!formData) {
      navigate("/");
      return;
    }
    
    // Generate a new simulation ID if we don't have one
    if (!simulationId) {
      setSimulationId(generateSimulationId());
    }
    // Reset the fetch flag when formData changes
    hasFetchedRef.current = false;
    
    return () => {
      // Cleanup: abort any ongoing fetch request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [formData, navigate, simulationId]);

  useEffect(() => {
    if (!formData || hasFetchedRef.current || !simulationId) {
      return;
    }
    
    // If we have a saved result and it's marked as historical, use it immediately
    if (savedResult && isHistorical) {
      setResult(savedResult);
      setLoading(false);
      hasFetchedRef.current = true;
      return;
    }
    
    // If we have a saved result but it's NOT historical (current simulation), use it but don't show historical alert
    if (savedResult && !isHistorical) {
      setResult(savedResult);
      setLoading(false);
      hasFetchedRef.current = true;
      return;
    }
    
    // Otherwise, fetch from the backend (new simulation)
    setLoading(true);
    hasFetchedRef.current = true;
    
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    
    fetch(`${API_URL}/api/simulation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      signal: abortControllerRef.current.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setResult(data);
      })
      .catch((error) => {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        setResult({ 
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
        });
      })
      .finally(() => setLoading(false));
  }, [formData, savedResult, isHistorical, navigate, API_URL]);

  const handleHistoryItemClick = (historyItem: any) => {
    navigate("/dashboard", { 
      state: { 
        formData: historyItem.formData, 
        savedResult: historyItem.result,
        isHistorical: true,
        simulationId: historyItem.id
      },
      replace: true
    });
  };

  const handleViewCurrent = () => {
    const mostRecent = getMostRecentHistoryItem();
    if (mostRecent) {
      navigate("/dashboard", { 
        state: { 
          formData: mostRecent.formData, 
          savedResult: mostRecent.result,
          isHistorical: false, // Mark as current, not historical
          simulationId: mostRecent.id // Use the same ID as history
        },
        replace: true
      });
    }
  };

  // Add helper function to get most recent history ID
  const getMostRecentHistoryId = () => {
    const savedHistory = localStorage.getItem("simulationHistory");
    if (savedHistory) {
      try {
        const history = JSON.parse(savedHistory);
        return history.length > 0 ? history[0].id : null;
      } catch (error) {
        console.error("Error parsing simulation history:", error);
      }
    }
    return null;
  };

  if (!formData) return null;

  const showHistoricalAlert = savedResult && isHistorical && simulationId !== getMostRecentHistoryId();

  return (
    <>
      <EnvironmentSidebar 
        formData={formData} 
        currentResult={result}
        currentSimulationId={simulationId}
        onHistoryItemClick={handleHistoryItemClick}
      />
      
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
          pt: 8,
        }}
      >
        {/* Show alert for historical results with option to view current */}
        {showHistoricalAlert && (
          <Alert 
            severity="info" 
            sx={{ mb: 2 }}
            action={
              <Button 
                color="inherit" 
                size="small" 
                endIcon={<RefreshIcon />}
                onClick={handleViewCurrent}
              >
                View Current
              </Button>
            }
          >
            Viewing saved simulation results from history
          </Alert>
        )}
        
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
                  numberOfAPs={formData.numberOfAccessPoints}
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