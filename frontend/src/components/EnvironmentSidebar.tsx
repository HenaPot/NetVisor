import { useState, useEffect, useRef } from "react"; // Add useRef import
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Button,
  Chip,
  Tabs,
  Tab,
  Alert,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

interface SimulationHistoryItem {
  id: string;
  timestamp: number;
  formData: Record<string, any>;
  result: any;
  summary?: string;
}

interface EnvironmentSidebarProps {
  formData: Record<string, any>;
  currentResult?: any;
  currentSimulationId?: string;
  onHistoryItemClick?: (historyItem: SimulationHistoryItem) => void;
}

const EnvironmentSidebar = ({
  formData,
  currentResult,
  currentSimulationId,
  onHistoryItemClick,
}: EnvironmentSidebarProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  // Use a ref to track which simulations have been saved during this session
  const savedSimulationIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const savedHistory = localStorage.getItem("simulationHistory");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        // Initialize the ref with existing IDs from localStorage
        parsedHistory.forEach((item: SimulationHistoryItem) => {
          savedSimulationIdsRef.current.add(item.id);
        });
      } catch (error) {
        console.error("Error parsing simulation history:", error);
      }
    }
  }, []);

  useEffect(() => {
    // Save current simulation to history if we have both formData and result
    if (formData && currentResult && currentSimulationId && !open) {
      // Check if we've already saved this simulation during this session
      if (!savedSimulationIdsRef.current.has(currentSimulationId)) {
        // Get current history from localStorage
        const savedHistory = localStorage.getItem("simulationHistory");
        const currentHistory = savedHistory ? JSON.parse(savedHistory) : [];
        
        // Check if this simulation is already in history using ID
        const alreadyExists = currentHistory.some((item: SimulationHistoryItem) => item.id === currentSimulationId);
        
        if (!alreadyExists) {
          const newHistoryItem: SimulationHistoryItem = {
            id: currentSimulationId,
            timestamp: Date.now(),
            formData,
            result: currentResult,
            summary: generateSummary(currentResult),
          };

          // Add to history and keep only last 20 items
          const updatedHistory = [
            newHistoryItem,
            ...currentHistory.filter((item: SimulationHistoryItem) => item.id !== currentSimulationId)
          ].slice(0, 20);

          setHistory(updatedHistory);
          savedSimulationIdsRef.current.add(currentSimulationId); // Mark as saved
          localStorage.setItem("simulationHistory", JSON.stringify(updatedHistory));
        }
      }
    }
  }, [formData, currentResult, currentSimulationId, open]);

  const generateSummary = (result: any): string => {
    if (!result || result.error) return "Error in simulation";
    
    const users = result.users_throughput?.length || 0;
    const timeSteps = result.time?.length || 0;
    const avgThroughput = result.users_throughput 
      ? (result.users_throughput.flat().reduce((sum: number, val: number) => sum + val, 0) / 
         (result.users_throughput.flat().length || 1)).toFixed(2)
      : "0";
    
    return `${users} users, ${timeSteps} steps, ${avgThroughput} avg throughput`;
  };

  const handleClearHistory = () => {
    setHistory([]);
    savedSimulationIdsRef.current.clear(); // Clear the ref too
    localStorage.removeItem("simulationHistory");
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          backgroundColor: "background.paper",
          boxShadow: 2,
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
        color="inherit"
      >
        <MenuIcon />
      </IconButton>
      
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 400,
            zIndex: (theme) => theme.zIndex.drawer + 1,
          },
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Box sx={{ width: 400, height: "100%", display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="h6">Simulation Panel</Typography>
              <IconButton onClick={() => setOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
            
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mt: 1 }}>
              <Tab icon={<SettingsIcon />} label="Current" />
              <Tab icon={<HistoryIcon />} label="History" />
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {activeTab === 0 ? (
              // Current Simulation Tab
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                    Current Parameters
                  </Typography>
                  <Chip 
                    label="Live" 
                    color="primary" 
                    size="small" 
                    variant="outlined" 
                  />
                </Box>
                
                <Divider sx={{ mb: 2 }} />
                
                <List dense>
                  {Object.entries(formData).map(([key, value]) => (
                    <ListItem key={key} sx={{ py: 0.5 }}>
                      <ListItemText
                        primary={key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        secondary={
                          Array.isArray(value)
                            ? value.join(", ")
                            : value?.toString()
                        }
                        primaryTypographyProps={{ variant: "body2", fontWeight: "bold" }}
                        secondaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : (
              // History Tab
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="subtitle1">Simulation History</Typography>
                  {history.length > 0 && (
                    <Button
                      size="small"
                      startIcon={<DeleteIcon />}
                      onClick={handleClearHistory}
                      color="error"
                    >
                      Clear
                    </Button>
                  )}
                </Box>

                {history.length === 0 ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No simulation history yet. Run simulations to build history.
                  </Alert>
                ) : (
                  <List>
                    {history.map((item) => (
                      <Box key={item.id}>
                        <ListItemButton 
                          onClick={() => onHistoryItemClick?.(item)}
                          sx={{ 
                            border: 1, 
                            borderColor: "divider", 
                            borderRadius: 1, 
                            mb: 1,
                            "&:hover": { backgroundColor: "action.hover" }
                          }}
                        >
                          <ListItemText
                            primary={formatTimestamp(item.timestamp)}
                            secondary={item.summary}
                            primaryTypographyProps={{ variant: "body2", fontWeight: "bold" }}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSection(item.id);
                            }}
                          >
                            {expandedSections[item.id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </IconButton>
                        </ListItemButton>
                        
                        <Collapse in={expandedSections[item.id]}>
                          <Box sx={{ pl: 2, pr: 2, pb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Parameters:
                            </Typography>
                            <List dense>
                              {Object.entries(item.formData).slice(0, 3).map(([key, value]) => (
                                <ListItem key={key} sx={{ py: 0 }}>
                                  <ListItemText
                                    primary={key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                                    secondary={
                                      Array.isArray(value)
                                        ? value.join(", ")
                                        : value?.toString()
                                    }
                                    primaryTypographyProps={{ variant: "caption", fontWeight: "bold" }}
                                    secondaryTypographyProps={{ variant: "caption" }}
                                  />
                                </ListItem>
                              ))}
                              {Object.keys(item.formData).length > 3 && (
                                <Typography variant="caption" color="textSecondary">
                                  ...and {Object.keys(item.formData).length - 3} more parameters
                                </Typography>
                              )}
                            </List>
                          </Box>
                        </Collapse>
                      </Box>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>
    </>
  );
};

export default EnvironmentSidebar;