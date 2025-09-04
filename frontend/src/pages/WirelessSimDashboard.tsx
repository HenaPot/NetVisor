// pages/WirelessSimDashboard.tsx
import { 
  Box, CircularProgress, Typography, Grid, IconButton, 
  FormControl, InputLabel, Select, MenuItem, Checkbox, 
  ListItemText, OutlinedInput, Button 
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef} from "react";
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

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

const WirelessSimDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { formData, savedResult, isHistorical, simulationId: incomingSimulationId } = location.state || {};
  
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulationId, setSimulationId] = useState(incomingSimulationId || "");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedAPs, setSelectedAPs] = useState<number[]>([]);
  const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  
  const hasFetchedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const generateSimulationId = () => {
    return `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  useEffect(() => {
    if (!result || !formData) return;

    const numUsers = result.users_throughput?.length || formData.numberOfUsers || 0;
    const numAPs = formData.numberOfAccessPoints || 0;

    setSelectedUsers(Array.from({ length: numUsers }, (_, i) => i));
    setSelectedAPs(Array.from({ length: numAPs }, (_, i) => i));
  }, [result, formData]);

  useEffect(() => {
    if (!formData) {
      navigate("/");
      return;
    }
    if (!simulationId) {
      setSimulationId(generateSimulationId());
    }
    hasFetchedRef.current = false;
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [formData, navigate, simulationId]);

  useEffect(() => {
    if (!formData || hasFetchedRef.current || !simulationId) {
      return;
    }
    
    if (savedResult) {
      setResult(savedResult);
      setLoading(false);
      hasFetchedRef.current = true;
      return;
    }
    
    setLoading(true);
    hasFetchedRef.current = true;
    
    abortControllerRef.current = new AbortController();
    
    fetch(`${API_URL}/api/simulation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
      signal: abortControllerRef.current.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return response.json();
      })
      .then((data) => setResult(data))
      .catch((error) => {
        if (error.name !== "AbortError") {
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
        }
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

  if (!formData) return null;

  const numUsers = result?.users_throughput?.length || formData.numberOfUsers || 0;
  const numAPs = formData?.numberOfAccessPoints || 0;

  const userOptions = Array.from({ length: numUsers }, (_, i) => `User ${i + 1}`);
  const apOptions = Array.from({ length: numAPs }, (_, i) => `AP ${i + 1}`);

  const handleUsersChange = (event: any) => {
    const value = event.target.value as string[];
    const newSelection = value.map(v => parseInt(v.split(" ")[1], 10) - 1);
    setSelectedUsers(newSelection);
  };

  const handleAPsChange = (event: any) => {
    const value = event.target.value as string[];
    const newSelection = value.map(v => parseInt(v.split(" ")[1], 10) - 1);
    setSelectedAPs(newSelection);
  };

  const selectAllUsers = () => {
    setSelectedUsers(Array.from({ length: numUsers }, (_, i) => i));
  };

  const deselectAllUsers = () => {
    setSelectedUsers([]);
  };

  const selectAllAPs = () => {
    setSelectedAPs(Array.from({ length: numAPs }, (_, i) => i));
  };

  const deselectAllAPs = () => {
    setSelectedAPs([]);
  };

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
          position: "fixed", top: 16, right: 16,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          backgroundColor: "background.paper", boxShadow: 2,
          "&:hover": { backgroundColor: "action.hover" },
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
          px: 2, py: 4, pt: 8,
        }}
      >
        <Box sx={{ display: "flex", gap: 2, mb: 3, alignItems: 'flex-end' }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" size="small" onClick={selectAllUsers}>
                Select All Users
              </Button>
              <Button variant="outlined" size="small" onClick={deselectAllUsers}>
                Deselect All
              </Button>
            </Box>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select Users</InputLabel>
              <Select
                multiple
                value={selectedUsers.map(u => `User ${u + 1}`)}
                onChange={handleUsersChange}
                input={<OutlinedInput label="Select Users" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
              >
                {userOptions.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={selectedUsers.includes(parseInt(name.split(" ")[1], 10) - 1)} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button variant="outlined" size="small" onClick={selectAllAPs}>
                Select All APs
              </Button>
              <Button variant="outlined" size="small" onClick={deselectAllAPs}>
                Deselect All
              </Button>
            </Box>
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Select APs</InputLabel>
              <Select
                multiple
                value={selectedAPs.map(a => `AP ${a + 1}`)}
                onChange={handleAPsChange}
                input={<OutlinedInput label="Select APs" />}
                renderValue={(selected) => selected.join(", ")}
                MenuProps={MenuProps}
              >
                {apOptions.map((name) => (
                  <MenuItem key={name} value={name}>
                    <Checkbox checked={selectedAPs.includes(parseInt(name.split(" ")[1], 10) - 1)} />
                    <ListItemText primary={name} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        
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
                  selectedUsers={selectedUsers}
                  selectedAPs={selectedAPs}
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <ThroughputChartCard 
                  throughput={result.users_throughput} 
                  macThroughput={result.users_mac_throughput}
                  time={result.time}
                  selectedUsers={selectedUsers}
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <PERChartCard 
                  per={result.users_per} 
                  time={result.time}
                  selectedUsers={selectedUsers}
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <CollisionChartCard 
                  collision={result.users_collision} 
                  retries={result.users_retries}
                  time={result.time}
                  selectedUsers={selectedUsers}
                />
              </Grid>
              <Grid item xs={12} {...({} as any)}>
                <HandoverChartCard 
                  handover={result.users_handover} 
                  time={result.time} 
                  numberOfAPs={formData.numberOfAccessPoints}
                  selectedUsers={selectedUsers}
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