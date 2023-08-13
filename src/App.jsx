import { useState } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { CssBaseline, Paper, Box, Typography, IconButton, Divider, Card, CardHeader, CardContent,
         Menu, MenuItem, FormControlLabel, Checkbox } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { InfoOutlined as InfoIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import Plotter2 from "./Plotter";
import InputSlider from './InputSlider';
import Fopdt from './Fopdt';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function step(t, rt, st) {
  return t > 0.0 && (!rt || t < st) ? 1.0 : 0.0;
}

function pid(simulationVars, controllerVars, controllerState, r, y) {
  const { samplingTime: ts } = simulationVars;
  const { Kc, Ti, Td } = controllerVars;
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


const ProcessVariants = [
  { title: 'First order plus dead time' },
  { title: 'Second order plus dead time' },
  { title: 'Water tank level' }
];


function App() {
  const theme = useTheme();

  const [simulationVars, setSimulationVars] = useState({
    simulationTime: 20.0,
    samplingTime: 0.1,
    stepTime: 10.0,
    stepReturn: false
  });

  const [processVars, setProcessVars] = useState({
    gain: 1.0,
    timeConstant: 0.6,
    delay: 1.0,
  });

  const [controllerVars, setControllerVars] = useState({
    Kc: 0.4,
    Ti: 1.3,
    Td: 0.0
  });

  const [processData, setProcessData] = useState(generateProcessData(simulationVars, processVars));
  const [controllerData, setControllerData] = useState(generateControllerData(simulationVars, processVars, controllerVars));

  function generateProcessData(simulationVars, processVars) {
    const { simulationTime: st, samplingTime: dt } = simulationVars;
    const ticks =  Array(Math.round((1.05 * st)/dt + 1)).fill().map((_, i) => -0.05 * st + dt * i);
    const stepData = ticks.map((t) => ({x: t, y: step(t, simulationVars.stepReturn, simulationVars.stepTime)}));

    const fopdt = new Fopdt(processVars.gain, processVars.timeConstant, processVars.delay, simulationVars.samplingTime);

    const result = {
      title: 'Open loop response',
      limits: { min: ticks[0], max: ticks[ticks.length] },
      datasets: [
        { label: 'Input', data: stepData },
        { label: 'Response', data: ticks.map((t, i) => ({x: t, y: fopdt.tf(stepData[i].y)})) }
      ]
    };

    return result;
  }

  function generateControllerData(simulationVars, processVars, controllerVars) {
    const controllerState = { ei: 0, y: 0, u: 0 };

    const { simulationTime: st, samplingTime: dt } = simulationVars;
    const ticks =  Array(Math.floor(st/dt)).fill().map((_, i) => -0.05 * st + dt * i);

    const fopdt = new Fopdt(processVars.gain, processVars.timeConstant, processVars.delay, simulationVars.samplingTime);

    const targetReference = Array(ticks.length);
    const controllerOutput = Array(ticks.length);
    const pOutput = Array(ticks.length);
    const iOutput = Array(ticks.length);
    const dOutput = Array(ticks.length);
    const processResponse = Array(ticks.length);

    ticks.map((t, k) => {
      const y = fopdt.tf(controllerState.u);
      const r = step(t, simulationVars.stepReturn, simulationVars.stepTime);
      const { u, p, i, d } = pid(simulationVars, controllerVars, controllerState, r, y);

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

  function updateData(simulationVars, processVars, controllerVars) {
    setProcessData(generateProcessData(simulationVars, processVars));
    setControllerData(generateControllerData(simulationVars, processVars, controllerVars));
  }

  function onSimulationTimeChange(event, newValue) {
    let newSimulationVars = {
      ...simulationVars,
      simulationTime: newValue
    };
    setSimulationVars(newSimulationVars);
    updateData(newSimulationVars, processVars, controllerVars);
  }

  function onSamplingTimeChange(event, newValue) {
    let newSimulationVars = {
      ...simulationVars,
      samplingTime: newValue
    };
    setSimulationVars(newSimulationVars);
    updateData(newSimulationVars, processVars, controllerVars);
  }

  function onStepTimeChange(event, newValue) {
    let newSimulationVars = {
      ...simulationVars,
      stepTime: newValue
    };
    setSimulationVars(newSimulationVars);
    updateData(newSimulationVars, processVars, controllerVars);
  }

  function onStepReturnChange(event, newValue) {
    let newSimulationVars = {
      ...simulationVars,
      stepReturn: newValue
    };
    setSimulationVars(newSimulationVars);
    updateData(newSimulationVars, processVars, controllerVars);
  }

  function onProcessGainChange(event, newValue) {
    let newProcessVars = {
      ...processVars,
      gain: newValue
    };
    setProcessVars(newProcessVars);
    updateData(simulationVars, newProcessVars, controllerVars);
  }

  function onProcessTimeConstantChange(event, newValue) {
    let newProcessVars = {
      ...processVars,
      timeConstant: newValue
    };
    setProcessVars(newProcessVars);
    console.log(controllerVars);
    updateData(simulationVars, newProcessVars, controllerVars);
  }

  function onProcessDelayChange(event, newValue) {
    let newProcessVars = {
      ...processVars,
      delay: newValue
    };
    setProcessVars(newProcessVars);
    updateData(simulationVars, newProcessVars, controllerVars);
  }

  function onKcChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Kc: newValue
    };
    setControllerVars(newControllerVars);
    updateData(simulationVars, processVars, newControllerVars);
  }

  function onTiChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Ti: newValue
    };
    setControllerVars(newControllerVars);
    updateData(simulationVars, processVars, newControllerVars);
  }

  function onTdChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Td: newValue
    };
    setControllerVars(newControllerVars);
    updateData(simulationVars, processVars, newControllerVars);
  }

  function onKpChange(event, newValue) {
    let newControllerVars = {
      Kc: newValue,
      Ti: controllerVars.Kc * controllerVars.Ti / newValue,
      Td: controllerVars.Kc * controllerVars.Td / newValue
    };
    setControllerVars(newControllerVars);
    updateData(simulationVars, processVars, newControllerVars);
  }

  function onKiChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Ti: newValue / controllerVars.Kc
    };
    setControllerVars(newControllerVars);
    updateData(simulationVars, processVars, newControllerVars);
  }

  function onKdChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Td: newValue / controllerVars.Kc
    };
    setControllerVars(newControllerVars);
    updateData(simulationVars, processVars, newControllerVars);
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
                <InputSlider min={0.1} max={100.0} step={0.1} value={simulationVars.simulationTime} onChange={onSimulationTimeChange} />
                <Box><InlineMath>t_&#123;sample&#125;</InlineMath></Box>
                <InputSlider min={0.01} max={1.0} step={0.01} value={simulationVars.samplingTime} onChange={onSamplingTimeChange} />
                <Box>
                  <FormControlLabel
                    control={<Checkbox checked={simulationVars.stepReturn} onChange={onStepReturnChange} />}
                    label={<InlineMath>t_&#123;step&#125;</InlineMath>}
                  />
                </Box>
                <InputSlider min={0.01} max={100.0} step={0.01} value={simulationVars.stepTime} disabled={!simulationVars.stepReturn} onChange={onStepTimeChange} />
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
                <Box><InlineMath>K_p</InlineMath></Box>
                <InputSlider min={0.1} max={10.0} step={0.1} value={processVars.gain} onChange={onProcessGainChange} />
                <Box><InlineMath>\tau_p</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={processVars.timeConstant} onChange={onProcessTimeConstantChange} />
                <Box><InlineMath>\theta_p</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={processVars.delay} onChange={onProcessDelayChange} />
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
                <InputSlider min={0.1} max={10.0} step={0.1} value={controllerVars.Kc} onChange={onKcChange} />
                <Box><InlineMath>\tau_i</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerVars.Ti} onChange={onTiChange} />
                <Box><InlineMath>\tau_d</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerVars.Td} onChange={onTdChange} />
                <Divider sx={{ gridColumn: '1 / span 2', my: 1 }} />
                <Box><InlineMath>K_p</InlineMath></Box>
                <InputSlider min={0.1} max={10.0} step={0.1} value={controllerVars.Kc} onChange={onKpChange} />
                <Box><InlineMath>K_i</InlineMath></Box>
                <InputSlider min={0.0} max={10.0 * controllerVars.Kc} step={0.1} value={controllerVars.Ti * controllerVars.Kc} onChange={onKiChange} />
                <Box><InlineMath>K_d</InlineMath></Box>
                <InputSlider min={0.0} max={10.0 * controllerVars.Kc} step={0.1} value={controllerVars.Td * controllerVars.Kc} onChange={onKdChange} />
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
