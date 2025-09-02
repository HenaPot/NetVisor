// src/components/EnvironmentSidebar.tsx
import { useState } from "react";
import {
  Drawer,
  IconButton,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

interface EnvironmentSidebarProps {
  formData: Record<string, any>;
}

const EnvironmentSidebar = ({ formData }: EnvironmentSidebarProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <IconButton
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          top: 16,
          left: 16,
          zIndex: (theme) => theme.zIndex.drawer + 2, // Increased z-index
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
            width: 300,
            zIndex: (theme) => theme.zIndex.drawer + 1,
          },
        }}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
      >
        <Box sx={{ width: 300, p: 2, height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Simulation Parameters
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {Object.entries(formData).map(([key, value]) => (
              <ListItem key={key} disablePadding sx={{ py: 1 }}>
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
      </Drawer>
    </>
  );
};

export default EnvironmentSidebar;