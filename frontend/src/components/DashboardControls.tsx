import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Box,
} from "@mui/material";

interface DashboardControlsProps {
  numUsers: number;
  numAPs: number;
  selectedUsers: number[];
  selectedAPs: number[];
  onUsersChange: (event: any) => void;
  onAPsChange: (event: any) => void;
}

const ITEM_HEIGHT = 36;
const ITEM_PADDING_TOP = 4;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 6 + ITEM_PADDING_TOP,
      width: 200,
    },
  },
};

const getDisplayValue = (selectedItems: number[], prefix: string) => {
  return selectedItems.map((item) => `${prefix} ${item + 1}`);
};

const DashboardControls: React.FC<DashboardControlsProps> = ({
  numUsers,
  numAPs,
  selectedUsers,
  selectedAPs,
  onUsersChange,
  onAPsChange,
}) => {
  const userOptions = Array.from({ length: numUsers }, (_, i) => `User ${i + 1}`);
  const apOptions = Array.from({ length: numAPs }, (_, i) => `AP ${i + 1}`);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <FormControl fullWidth size="small">
        <InputLabel>Select Users</InputLabel>
        <Select
          multiple
          value={getDisplayValue(selectedUsers, "User")}
          onChange={onUsersChange}
          input={<OutlinedInput label="Select Users" />}
          renderValue={(selected) =>
            selected.length > 6
              ? `${selected.slice(0, 6).join(", ")}...`
              : selected.join(", ")
          }
          MenuProps={MenuProps}
        >
          {userOptions.map((name) => (
            <MenuItem key={name} value={name}>
              <Checkbox
                checked={selectedUsers.includes(parseInt(name.split(" ")[1], 10) - 1)}
              />
              <ListItemText primary={name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth size="small">
        <InputLabel>Select APs</InputLabel>
        <Select
          multiple
          value={getDisplayValue(selectedAPs, "AP")}
          onChange={onAPsChange}
          input={<OutlinedInput label="Select APs" />}
          renderValue={(selected) =>
            selected.length > 7
              ? `${selected.slice(0, 7).join(", ")}...`
              : selected.join(", ")
          }
          MenuProps={MenuProps}
        >
          {apOptions.map((name) => (
            <MenuItem key={name} value={name}>
              <Checkbox
                checked={selectedAPs.includes(parseInt(name.split(" ")[1], 10) - 1)}
              />
              <ListItemText primary={name} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DashboardControls;