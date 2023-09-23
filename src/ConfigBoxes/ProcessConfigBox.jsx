import { useState } from "react";
import { InlineMath } from 'react-katex';
import { Box, Typography, Card, CardHeader, CardContent, Menu, MenuItem, IconButton, Popover } from '@mui/material';
import { InfoOutlined as InfoIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import InputSlider from '../InputSlider';

export default function SimulationConfigBox(props) {

  const {
    processVariants,
    processId,
    processParams,
    onProcessChange,
    onProcessVarChange
  } = props;

  const [anchorElProcessConfig, setAnchorElProcessConfig] = useState(null);
  const processConfigOpen = Boolean(anchorElProcessConfig);

  function handleProcessConfigOpen(event) {
    setAnchorElProcessConfig(event.currentTarget);
  }

  function handleProcessConfigClose(newProcessId) {
    setAnchorElProcessConfig(null);
    if (newProcessId !== undefined) {
      onProcessChange(newProcessId);
    }
  }


  const [anchorElProcessInfo, setAnchorElProcessInfo] = useState(null);
  const processInfoOpen = Boolean(anchorElProcessInfo);

  function handleProcessInfoOpen(event) {
    setAnchorElProcessInfo(event.currentTarget);
  }

  function handleProcessInfoClose() {
    setAnchorElProcessInfo(null);
  }


  return (
    <Card>
      <CardHeader
        action={
          <>
            <IconButton onClick={handleProcessInfoOpen}><InfoIcon /></IconButton>
            <IconButton onClick={handleProcessConfigOpen}><MoreVertIcon /></IconButton>
          </>
        }
        title={<Typography>Process</Typography>}
        subheader={processVariants[processId].title}
      />
      <CardContent>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          columnGap: 1,
          alignItems: 'center'
        }}>
          {
            processVariants[processId].paramDefinitions.map((p) => (
              <Box key={p.name} sx={{ display: 'contents' }}>
                <Box><InlineMath>{p.title}</InlineMath></Box>
                <InputSlider min={p.min} max={p.max} step={0.1} value={processParams[p.name]} onChange={(e, v) => { onProcessVarChange(p.name, v) }} />
              </Box>
            ))
          }
        </Box>
      </CardContent>
      <Menu anchorEl={anchorElProcessConfig} open={processConfigOpen} onClose={() => {handleProcessConfigClose();}} >
        { processVariants.map((p, i) => <MenuItem key={i} selected={ i==processId } onClick={() => {handleProcessConfigClose(i);}}>{p.title}</MenuItem>) }
      </Menu>
      <Popover
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right', }}
        transformOrigin={{ vertical: 'bottom', horizontal: 'left', }}
        anchorEl={anchorElProcessInfo}
        open={processInfoOpen}
        onClose={handleProcessInfoClose}
      >
        <Box sx={{ p: 2, width: 700 }}>
          <Typography variant="h5">Process Description</Typography>
          { processVariants[processId].info }
        </Box>
      </Popover>
    </Card>
  );
}
