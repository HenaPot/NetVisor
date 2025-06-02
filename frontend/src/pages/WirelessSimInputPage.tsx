import React from "react";
import { useNavigate } from "react-router-dom";
import WirelessSimInputForm from "../components/WirelessSimInputForm";

const WirelessSimInputPage: React.FC = () => {
  const navigate = useNavigate();

  const handleFormSubmit = (formData: Record<string, any>) => {
    navigate("/dashboard", { state: { formData } });
  };

  return <WirelessSimInputForm onSubmit={handleFormSubmit} />;
};

export default WirelessSimInputPage;
