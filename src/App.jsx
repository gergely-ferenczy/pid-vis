import { useState } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { CssBaseline, Box, Typography, IconButton, Divider, Card, CardHeader, CardContent,
         Menu, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { InfoOutlined as InfoIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import Plotter2 from "./Plotter";
import InputSlider from './InputSlider';
import Fopdt from './Processes/Fopdt';
import WaterTank from './Processes/WaterTank';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function step(t, rt, st) {
  return t > 0.0 && (!rt || t < st) ? 1.0 : 0.0;
}

function pid(simulationParams, controllerParams, controllerState, r, y) {
  const { samplingTime: ts } = simulationParams;
  const { Kc, Ti, Td } = controllerParams;
  const { ei: ei_prev, y: y_prev } = controllerState;


  const e = r - y;
  const ei = ei_prev + e;
  const yd = y - y_prev;
  const p = Kc * e;
  const i = Kc * Ti * ts * ei;
  const d = -Kc * Td / ts * yd;
  const u = p + i + d;
  controllerState.ei = ei;
  controllerState.y = y;
  controllerState.u = u;
  return { u, p, i, d };
}


const ProcessVariants = [ Fopdt, WaterTank ];


function App() {
  const theme = useTheme();

  const [simulationParams, setSimulationParams] = useState({
    simulationTime: 20.0,
    samplingTime: 0.1,
    stepTime: 10.0,
    stepReturn: false
  });

  const [controllerParams, setControllerParams] = useState({
    Kc: 0.4,
    Ti: 1.3,
    Td: 0.0
  });

  const [processId, setProcessId] = useState(0);
  const [processParams, setProcessParams] = useState(ProcessVariants[0].defaultParams);

  const [processData, setProcessData] = useState(generateProcessData(simulationParams, processParams));
  const [controllerData, setControllerData] = useState(generateControllerData(simulationParams, processParams, controllerParams));

  function generateProcessData(simulationParams, processParams) {
    const { simulationTime: st, samplingTime: dt } = simulationParams;
    const ticks =  Array(Math.round((1.05 * st)/dt + 1)).fill().map((_, i) => -0.05 * st + dt * i);
    const stepData = ticks.map((t) => ({x: t, y: step(t, simulationParams.stepReturn, simulationParams.stepTime)}));

    const process = new ProcessVariants[processId](processParams, simulationParams.samplingTime);

    const result = {
      title: 'Open loop response',
      limits: { min: ticks[0], max: ticks[ticks.length] },
      datasets: [
        { label: 'Input', data: stepData },
        { label: 'Response', data: ticks.map((t, i) => ({x: t, y: process.tf(stepData[i].y)})) }
      ]
    };

    return result;
  }

  function generateControllerData(simulationParams, processParams, controllerParams) {
    const controllerState = { ei: 0, y: 0, u: 0 };

    const { simulationTime: st, samplingTime: dt } = simulationParams;
    const ticks =  Array(Math.round((1.05 * st)/dt + 1)).fill().map((_, i) => -0.05 * st + dt * i);

    const process = new ProcessVariants[processId](processParams, simulationParams.samplingTime);

    const targetReference = Array(ticks.length);
    const controllerOutput = Array(ticks.length);
    const pOutput = Array(ticks.length);
    const iOutput = Array(ticks.length);
    const dOutput = Array(ticks.length);
    const processResponse = Array(ticks.length);

    ticks.map((t, k) => {
      const y = process.tf(controllerState.u);
      const r = step(t, simulationParams.stepReturn, simulationParams.stepTime);
      const { u, p, i, d } = pid(simulationParams, controllerParams, controllerState, r, y);

      targetReference[k] = { x: t, y: r };
      controllerOutput[k] = { x: t, y: u };
      processResponse[k] = { x: t, y: y };
      pOutput[k] = { x: t, y: p };
      iOutput[k] = { x: t, y: i };
      dOutput[k] = { x: t, y: d };
    });

    const result = {
      title: 'Closed loop response',
      limits: { min: ticks[0], max: ticks[ticks.length] },
      datasets: [
        { label: 'r', data: targetReference },
        { label: 'u', data: controllerOutput },
        { label: 'y', data: processResponse },
        { label: 'p', data: pOutput, hidden: true },
        { label: 'i', data: iOutput, hidden: true },
        { label: 'd', data: dOutput, hidden: true }
      ]
    };

    return result;
  }

  function updateData(simulationParams, processParams, controllerParams) {
    setProcessData(generateProcessData(simulationParams, processParams));
    setControllerData(generateControllerData(simulationParams, processParams, controllerParams));
  }

  function onSimulationTimeChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      simulationTime: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processParams, controllerParams);
  }

  function onSamplingTimeChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      samplingTime: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processParams, controllerParams);
  }

  function onStepTimeChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      stepTime: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processParams, controllerParams);
  }

  function onStepReturnChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      stepReturn: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processParams, controllerParams);
  }

  function onKcChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Kc: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processParams, newControllerParams);
  }

  function onTiChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Ti: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processParams, newControllerParams);
  }

  function onTdChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Td: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processParams, newControllerParams);
  }

  function onKpChange(event, newValue) {
    const newControllerParams = {
      Kc: newValue,
      Ti: controllerParams.Kc * controllerParams.Ti / newValue,
      Td: controllerParams.Kc * controllerParams.Td / newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processParams, newControllerParams);
  }

  function onKiChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Ti: newValue / controllerParams.Kc
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processParams, newControllerParams);
  }

  function onKdChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Td: newValue / controllerParams.Kc
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processParams, newControllerParams);
  }

  function onProcessVarChange(paramId, newValue) {
    let newProcessParams = { ...processParams };
    newProcessParams[paramId] = newValue;
    setProcessParams(newProcessParams);
    updateData(simulationParams, newProcessParams, controllerParams);
  }

  const [anchorElProcessConfig, setAnchorSimConfigAction] = useState(null);
  const processConfigOpen = Boolean(anchorElProcessConfig);

  function handleProcessConfigOpen(event) {
    setAnchorSimConfigAction(event.currentTarget);
  }

  function handleProcessConfigClose() {
    setAnchorSimConfigAction(null);
  }

  return (
    <>
      <CssBaseline />
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        columnGap: 2,
        padding: 1
      }}>
        <Box sx={{
          display: 'grid',
          gridAutoFlow: 'row',
          gridAutoRows: 'min-content',
          alignContent: 'start',
          rowGap: 1
        }}>
          <Card>
            <CardHeader
              title={<Typography>Simulation configuration</Typography>}
            />
            <CardContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr'
              }}>
                <Box><InlineMath>t_&#123;sim&#125;</InlineMath></Box>
                <InputSlider min={0.1} max={100.0} step={0.1} value={simulationParams.simulationTime} onChange={onSimulationTimeChange} />
                <Box><InlineMath>t_&#123;sample&#125;</InlineMath></Box>
                <InputSlider min={0.01} max={1.0} step={0.01} value={simulationParams.samplingTime} onChange={onSamplingTimeChange} />
                <Box>
                  <FormControlLabel
                    control={<Checkbox checked={simulationParams.stepReturn} onChange={onStepReturnChange} />}
                    label={<InlineMath>t_&#123;step&#125;</InlineMath>}
                  />
                </Box>
                <InputSlider min={0.01} max={100.0} step={0.01} value={simulationParams.stepTime} disabled={!simulationParams.stepReturn} onChange={onStepTimeChange} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              action={
                <IconButton onClick={handleProcessConfigOpen}><MoreVertIcon /></IconButton>
              }
              title={<Typography>Process configuration</Typography>}
            />
            <CardContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr'
              }}>
                {
                  ProcessVariants[processId].paramDefinitions.map((p) => (
                    <Box key={p.name} sx={{ display: 'contents' }}>
                      <Box><InlineMath>{p.title}</InlineMath></Box>
                      <InputSlider min={0.1} max={10.0} step={0.1} value={processParams[p.name]} onChange={(e, v) => { onProcessVarChange(p.name, v) }} />
                    </Box>
                  ))
                }
              </Box>
            </CardContent>
            <Menu anchorEl={anchorElProcessConfig} open={processConfigOpen} onClose={handleProcessConfigClose} >
              { ProcessVariants.map((p, i) => <MenuItem key={i}>{p.title}</MenuItem>) }
            </Menu>
          </Card>
          <Card>
            <CardHeader
              title={<Typography>Controller configuration</Typography>}
            />
            <CardContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr'
              }}>
                <Box><InlineMath>K_c</InlineMath></Box>
                <InputSlider min={0.1} max={10.0} step={0.1} value={controllerParams.Kc} onChange={onKcChange} />
                <Box><InlineMath>\tau_i</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerParams.Ti} onChange={onTiChange} />
                <Box><InlineMath>\tau_d</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerParams.Td} onChange={onTdChange} />
                <Divider sx={{ gridColumn: '1 / span 2', my: 1 }} />
                <Box><InlineMath>K_p</InlineMath></Box>
                <InputSlider min={0.1} max={10.0} step={0.1} value={controllerParams.Kc} onChange={onKpChange} />
                <Box><InlineMath>K_i</InlineMath></Box>
                <InputSlider min={0.0} max={10.0 * controllerParams.Kc} step={0.1} value={controllerParams.Ti * controllerParams.Kc} onChange={onKiChange} />
                <Box><InlineMath>K_d</InlineMath></Box>
                <InputSlider min={0.0} max={10.0 * controllerParams.Kc} step={0.1} value={controllerParams.Td * controllerParams.Kc} onChange={onKdChange} />
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{
          minWidth: '600px',
          maxHeight: `calc(100vh - ${theme.spacing(2)})`,
          aspectRatio: 1,
          overflow: 'hidden',
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateRows: '1fr 1fr',
          rowGap: 2
        }}>
          <Plotter2 data={processData} />
          <Plotter2 data={controllerData} />
        </Box>
      </Box>
    </>
  );
}

export default App;
