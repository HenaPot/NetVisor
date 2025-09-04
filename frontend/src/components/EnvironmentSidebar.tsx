import { useState, useEffect, useRef } from "react";
import {
  SwipeableDrawer,
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
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import HistoryIcon from "@mui/icons-material/History";
import SettingsIcon from "@mui/icons-material/Settings";
import FilterListIcon from "@mui/icons-material/FilterList";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import FileDownloadIcon from "@mui/icons-material/FileDownload";

import DashboardControls from "./DashboardControls"; // make sure path is correct

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
  numUsers: number;
  numAPs: number;
  selectedUsers: number[];
  selectedAPs: number[];
  onUsersChange: (event: any) => void;
  onAPsChange: (event: any) => void;
  onReset?: () => void;
  onHistoryItemClick?: (historyItem: SimulationHistoryItem) => void;
}

const EnvironmentSidebar = ({
  formData,
  currentResult,
  currentSimulationId,
  numUsers,
  numAPs,
  selectedUsers,
  selectedAPs,
  onUsersChange,
  onAPsChange,
  onReset,
  onHistoryItemClick,
}: EnvironmentSidebarProps) => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});
  const [exportFormat, setExportFormat] = useState("json");
  const [exportFileName, setExportFileName] = useState("");

  const iOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent);

  const savedSimulationIdsRef = useRef<Set<string>>(new Set());

  const toggleSidebar = (newOpen: boolean) => () => {
    setOpen(newOpen);
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem("simulationHistory");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        setHistory(parsedHistory);
        parsedHistory.forEach((item: SimulationHistoryItem) => {
          savedSimulationIdsRef.current.add(item.id);
        });
      } catch (error) {
        console.error("Error parsing simulation history:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (formData && currentResult && currentSimulationId && !open) {
      if (!savedSimulationIdsRef.current.has(currentSimulationId)) {
        const savedHistory = localStorage.getItem("simulationHistory");
        const currentHistory = savedHistory ? JSON.parse(savedHistory) : [];

        const alreadyExists = currentHistory.some(
          (item: SimulationHistoryItem) => item.id === currentSimulationId
        );

        if (!alreadyExists) {
          const newHistoryItem: SimulationHistoryItem = {
            id: currentSimulationId,
            timestamp: Date.now(),
            formData,
            result: currentResult,
            summary: generateSummary(currentResult),
          };

          const updatedHistory = [
            newHistoryItem,
            ...currentHistory.filter(
              (item: SimulationHistoryItem) => item.id !== currentSimulationId
            ),
          ].slice(0, 20);

          setHistory(updatedHistory);
          savedSimulationIdsRef.current.add(currentSimulationId);
          localStorage.setItem("simulationHistory", JSON.stringify(updatedHistory));
        }
      }
    }
  }, [formData, currentResult, currentSimulationId, open]);

  useEffect(() => {
    // Set default export file name when currentResult changes
    if (currentResult && !exportFileName) {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      setExportFileName(`simulation_results_${timestamp}`);
    }
  }, [currentResult, exportFileName]);

  const generateSummary = (result: any): string => {
    if (!result || result.error) return "Error in simulation";

    const users = result.users_throughput?.length || 0;
    const timeSteps = result.time?.length || 0;
    const avgThroughput = result.users_throughput
      ? (
          result.users_throughput.flat().reduce(
            (sum: number, val: number) => sum + val,
            0
          ) / (result.users_throughput.flat().length || 1)
        ).toFixed(2)
      : "0";

    return `${users} users, ${timeSteps} steps, ${avgThroughput} avg throughput`;
  };

  const handleClearHistory = () => {
    setHistory([]);
    savedSimulationIdsRef.current.clear();
    localStorage.removeItem("simulationHistory");
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const handleExport = () => {
    if (!currentResult) return;

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        simulationId: currentSimulationId,
        exportFormat,
        parameters: formData,
      },
      results: currentResult
    };

    let data: string;
    let mimeType: string;
    let fileExtension: string;

    switch (exportFormat) {
      case "json":
        data = JSON.stringify(exportData, null, 2);
        mimeType = "application/json";
        fileExtension = "json";
        break;
      case "csv":
        // Simple CSV conversion for main metrics
        data = convertToCSV(exportData);
        mimeType = "text/csv";
        fileExtension = "csv";
        break;
      default:
        return;
    }

    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exportFileName}.${fileExtension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertToCSV = (data: any): string => {
    // Simple CSV conversion focusing on main metrics
    const lines = [];
    
    // Add metadata
    lines.push("METADATA");
    lines.push(`Export Date,${data.metadata.exportDate}`);
    lines.push(`Simulation ID,${data.metadata.simulationId}`);
    lines.push("");
    
    // Add parameters
    lines.push("PARAMETERS");
    Object.entries(data.metadata.parameters).forEach(([key, value]) => {
      lines.push(`${key},${Array.isArray(value) ? value.join(';') : value}`);
    });
    lines.push("");
    
    // Add results summary
    lines.push("RESULTS SUMMARY");
    const result = data.results;
    lines.push(`Time Steps,${result.time?.length || 0}`);
    lines.push(`Users,${result.users_throughput?.length || 0}`);
    lines.push(`Access Points,${formData.numberOfAccessPoints || 0}`);
    lines.push("");
    
    return lines.join("\n");
  };

  return (
    <>
      {!open && (
        <IconButton
          onClick={toggleSidebar(true)}
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
      )}

      <SwipeableDrawer
        anchor="left"
        open={open}
        onClose={toggleSidebar(false)}
        onOpen={toggleSidebar(true)}
        disableBackdropTransition={!iOS}
        disableDiscovery={iOS}
        ModalProps={{
          hideBackdrop: true,
        }}
        sx={{
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: 400,
            zIndex: (theme) => theme.zIndex.drawer + 1,
            "@media (max-width: 600px)": {
              width: "85%",
              maxWidth: "300px",
            },
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography variant="h6">Simulation Panel</Typography>
              <IconButton onClick={toggleSidebar(false)} size="small">
                <CloseIcon />
              </IconButton>
            </Box>

            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{ mt: 1 }}
              scrollButtons="auto"
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab icon={<SettingsIcon />} label="Current" />
              <Tab icon={<HistoryIcon />} label="History" />
              <Tab icon={<FilterListIcon />} label="Filter" />
              <Tab icon={<FileDownloadIcon />} label="Export" />
            </Tabs>
          </Box>

          {/* Content */}
          <Box sx={{ flex: 1, overflow: "auto" }}>
            {activeTab === 0 ? (
              // Current
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
                        primary={key
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                        secondary={
                          Array.isArray(value) ? value.join(", ") : value?.toString()
                        }
                        primaryTypographyProps={{ variant: "body2", fontWeight: "bold" }}
                        secondaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            ) : activeTab === 1 ? (
              // History
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
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
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <ListItemText
                            primary={formatTimestamp(item.timestamp)}
                            secondary={item.summary}
                            primaryTypographyProps={{
                              variant: "body2",
                              fontWeight: "bold",
                            }}
                            secondaryTypographyProps={{ variant: "caption" }}
                          />
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSection(item.id);
                            }}
                          >
                            {expandedSections[item.id] ? (
                              <ExpandLessIcon />
                            ) : (
                              <ExpandMoreIcon />
                            )}
                          </IconButton>
                        </ListItemButton>

                        <Collapse in={expandedSections[item.id]}>
                          <Box sx={{ pl: 2, pr: 2, pb: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Parameters:
                            </Typography>
                            <List dense>
                              {Object.entries(item.formData).map(([key, value]) => (
                                <ListItem key={key} sx={{ py: 0 }}>
                                  <ListItemText
                                    primary={key
                                      .replace(/_/g, " ")
                                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                                    secondary={
                                      Array.isArray(value)
                                        ? value.join(", ")
                                        : value?.toString()
                                    }
                                    primaryTypographyProps={{
                                      variant: "caption",
                                      fontWeight: "bold",
                                    }}
                                    secondaryTypographyProps={{ variant: "caption" }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                        </Collapse>
                      </Box>
                    ))}
                  </List>
                )}
              </Box>
            ) : activeTab === 2 ? (
              // Filter
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Filter Options
                </Typography>
                <DashboardControls
                  numUsers={numUsers}
                  numAPs={numAPs}
                  selectedUsers={selectedUsers}
                  selectedAPs={selectedAPs}
                  onUsersChange={onUsersChange}
                  onAPsChange={onAPsChange}
                />
              </Box>
            ) : (
              // Export
              <Box sx={{ p: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Export Results
                </Typography>
                
                {!currentResult ? (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    No simulation results available for export.
                  </Alert>
                ) : (
                  <>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Format</InputLabel>
                      <Select
                        value={exportFormat}
                        onChange={(e) => setExportFormat(e.target.value)}
                        label="Format"
                      >
                        <MenuItem value="json">JSON</MenuItem>
                        <MenuItem value="csv">CSV (Summary)</MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      fullWidth
                      label="File Name"
                      value={exportFileName}
                      onChange={(e) => setExportFileName(e.target.value)}
                      sx={{ mb: 2 }}
                    />

                    <Button
                      variant="contained"
                      startIcon={<FileDownloadIcon />}
                      onClick={handleExport}
                      fullWidth
                    >
                      Export Results
                    </Button>

                    <Alert severity="info" sx={{ mt: 2 }}>
                      Exports include simulation parameters and all result data.
                      {exportFormat === "csv" && " CSV format provides a summary of the results."}
                    </Alert>
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* Footer Reset - only show on Filter tab */}
          {activeTab === 2 && (
            <Box
              sx={{
                p: 2,
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="contained"
                color="secondary"
                onClick={onReset}
              >
                Reset Filters
              </Button>
            </Box>
          )}
        </Box>
      </SwipeableDrawer>
    </>
  );
};

export default EnvironmentSidebar;