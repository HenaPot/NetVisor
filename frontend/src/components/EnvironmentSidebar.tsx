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
          zIndex: (theme) => theme.zIndex.drawer + 1,
          display: open ? "none" : "inline-flex",
        }}
        color="inherit"
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        ModalProps={{
          BackdropProps: {
            invisible: true, // No dark overlay
          },
        }}
      >
        <Box sx={{ width: 300, p: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Simulation Input
            </Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider />
          <List>
            {Object.entries(formData).map(([key, value]) => (
              <ListItem key={key} disablePadding>
                <ListItemText
                  primary={key}
                  secondary={
                    Array.isArray(value)
                      ? value.join(", ")
                      : value?.toString()
                  }
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
