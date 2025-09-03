import React from "react";
import { useNavigate } from "react-router-dom";
import WirelessSimInputForm from "../components/WirelessSimInputForm";

const WirelessSimInputPage: React.FC = () => {
  const navigate = useNavigate();

  const handleFormSubmit = (formData: Record<string, any>) => {
    const simulationId = `sim-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    navigate("/dashboard", { 
      state: { 
        formData,
        isHistorical: false,
        simulationId
      } 
    });
  };

  return <WirelessSimInputForm onSubmit={handleFormSubmit} />;
};

export default WirelessSimInputPage;