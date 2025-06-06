import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CssBaseline from '@mui/material/CssBaseline';
import WirelessSimInputPage from "./pages/WirelessSimInputPage";
import WirelessSimDashboard from "./pages/WirelessSimDashboard";


const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

export default function App() {
  return (
    <Router>
      <ThemeProvider theme={darkTheme}>
        <CssBaseline />
        <Routes>
          <Route path="/" element={<WirelessSimInputPage />} />
          <Route path="/dashboard" element={<WirelessSimDashboard />} />
        </Routes>
      </ThemeProvider>
    </Router>
  );
}
