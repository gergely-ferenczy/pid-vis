import { useState } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { CssBaseline, Paper, Box, Typography, IconButton, Divider, Card, CardHeader, CardContent,
         Menu, MenuItem } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { InfoOutlined as InfoIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import Plotter2 from "./Plotter2";
import InputSlider from './InputSlider';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function step(t) {
  return t > 0.0 ? 1.0 : 0.0;
}

function fopdtTf(Kp, Tc, dt, u, processState) {
  const ua = processState.ua;
  ua.splice(0, 1);
  ua.push(u);
  
  const yp = processState.yp;
  let y = 1 / (2 * Tc + dt) * (Kp * dt * (ua[0] + ua[1]) - (dt - 2 * Tc) * yp);

  processState.yp = y;

  return y;
}


function pid(Kc, Ti, Td, ts, r, y, pidState) {
  const e = r - y;
  const ei = pidState.ei + e;
  const yd = y - pidState.yp;
  const p = Kc * e;
  const i = Kc * Ti * ts * ei;
  const d = -Kc * Td / ts * yd;
  const u = p + i + d;
  pidState.ei = ei;
  pidState.yp = y;
  return { u, p, i, d };
}


function App() {
  const theme = useTheme();
  console.log(theme);

  const [globalVars, setGlobalVars] = useState({
    simulationTime: 10.0,
    samplingTime: 0.1
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

  const [processData, setProcessData] = useState(generateProcessData(globalVars, processVars));
  const [controllerData, setControllerData] = useState(generateControllerData(globalVars, processVars, controllerVars));

  function generateProcessData(globalVars, processVars) {
    const { simulationTime: st, samplingTime: dt } = globalVars;
    const { gain: pG, delay: pD, timeConstant: pTc } = processVars;
    const ticks =  Array(Math.round((1.05 * st)/dt + 1)).fill().map((_, i) => -0.05 * st + dt * i);
    const processState = { ua: Array(Math.floor(pD / dt) + 2).fill(0), yp: 0.0 };

    const result = {
      title: 'Open loop response',
      limits: { min: ticks[0], max: ticks[ticks.length] },
      datasets: [
        { label: 'Input', data: ticks.map((t) => ({x: t, y: step(t)})) },
        { label: 'Response', data: ticks.map((t) => ({x: t, y: fopdtTf(pG, pTc, dt, step(t), processState)})) }
      ]
    };

    return result;
  }

  function generateControllerData(globalVars, processVars, controllerVars) {
    const pidState = { ei: 0, yp: 0, up: 0 };

    const { simulationTime: st, samplingTime: dt } = globalVars;
    const { gain: pG, delay: pD, y0, timeConstant: pTc } = processVars;
    const { Kc, Ti, Td } = controllerVars;
    const ticks =  Array(Math.floor(st/dt)).fill().map((_, i) => -0.05 * st + dt * i);
    const processState = { ua: Array(Math.floor(pD / dt) + 2).fill(0), yp: 0.0 };

    const targetReference = Array(ticks.length);
    const controllerOutput = Array(ticks.length);
    const pOutput = Array(ticks.length);
    const iOutput = Array(ticks.length);
    const dOutput = Array(ticks.length);
    const processResponse = Array(ticks.length);

    ticks.map((t, k) => {
      const y = fopdtTf(pG, pTc, dt, pidState.up, processState);

      const {u, p, i, d} = pid(Kc, Ti, Td, dt, step(t), y, pidState);
      pidState.up = u;
      
      targetReference[k] = { x: t, y: step(t) };
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

  function updateData(globalVars, processVars, controllerVars) {
    setProcessData(generateProcessData(globalVars, processVars));
    setControllerData(generateControllerData(globalVars, processVars, controllerVars));
  }

  function onSimulationTimeChange(event, newValue) {
    let newGlobalVars = {
      ...globalVars,
      simulationTime: newValue
    };
    setGlobalVars(newGlobalVars);
    updateData(newGlobalVars, processVars, controllerVars);
  } 

  function onSamplingTimeChange(event, newValue) {
    let newGlobalVars = {
      ...globalVars,
      samplingTime: newValue
    };
    setGlobalVars(newGlobalVars);
    updateData(newGlobalVars, processVars, controllerVars);
  } 

  function onProcessGainChange(event, newValue) {
    let newProcessVars = {
      ...processVars,
      gain: newValue
    };
    setProcessVars(newProcessVars);
    updateData(globalVars, newProcessVars, controllerVars);
  }

  function onProcessTimeConstantChange(event, newValue) {
    let newProcessVars = {
      ...processVars,
      timeConstant: newValue
    };
    setProcessVars(newProcessVars);
    console.log(controllerVars);
    updateData(globalVars, newProcessVars, controllerVars);
  }

  function onProcessDelayChange(event, newValue) {
    let newProcessVars = {
      ...processVars,
      delay: newValue
    };
    setProcessVars(newProcessVars);
    updateData(globalVars, newProcessVars, controllerVars);
  }

  function onKcChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Kc: newValue
    };
    setControllerVars(newControllerVars);
    updateData(globalVars, processVars, newControllerVars);
  }

  function onTiChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Ti: newValue
    };
    setControllerVars(newControllerVars);
    updateData(globalVars, processVars, newControllerVars);
  }

  function onTdChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Td: newValue
    };
    setControllerVars(newControllerVars);
    updateData(globalVars, processVars, newControllerVars);
  }

  function onKpChange(event, newValue) {
    let newControllerVars = {
      Kc: newValue,
      Ti: controllerVars.Kc * controllerVars.Ti / newValue,
      Td: controllerVars.Kc * controllerVars.Td / newValue
    };
    setControllerVars(newControllerVars);
    updateData(globalVars, processVars, newControllerVars);
  }

  function onKiChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Ti: newValue / controllerVars.Kc
    };
    setControllerVars(newControllerVars);
    updateData(globalVars, processVars, newControllerVars);
  }

  function onKdChange(event, newValue) {
    let newControllerVars = {
      ...controllerVars,
      Td: newValue / controllerVars.Kc
    };
    setControllerVars(newControllerVars);
    updateData(globalVars, processVars, newControllerVars);
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
                <InputSlider min={0.1} max={100.0} step={0.1} value={globalVars.simulationTime} onChange={onSimulationTimeChange} />
                <Box><InlineMath>t_&#123;sample&#125;</InlineMath></Box>
                <InputSlider min={0.01} max={1.0} step={0.01} value={globalVars.samplingTime} onChange={onSamplingTimeChange} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              action={
                <IconButton><MoreVertIcon /></IconButton>
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
            <Menu>
              <MenuItem>Profile</MenuItem>
              <MenuItem>My account</MenuItem>
              <MenuItem>Logout</MenuItem>
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



      {/* <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'min-content 1fr'
      }}>
        <Box sx={{
          display: 'grid',
          gridTemplateAreas: `'t1 s1' 't2 s2'
                              't3 s3' 't4 s4' 't5 s5'
                              't6 s6' 't7 s7' 't8 s8' 'd d' 't9 s9' 't10 s10' 't11 s11'`,
          gridTemplateColumns: 'max-content 400px',
          alignContent: 'start',
          alignItems: 'center',
          gap: 1,
          padding: 1
        }}>
          <Paper sx={{ gridArea: 't1-start / t1-start / s2-end / s2-end', alignSelf: 'stretch' }} />
          <Paper sx={{ gridArea: 't3-start / t3-start / s5-end / s5-end', alignSelf: 'stretch' }} />
          <Paper sx={{ gridArea: 't6-start / t6-start / s11-end / s11-end', alignSelf: 'stretch' }} />

          <Box sx={{ gridArea: 't1' }}><InlineMath>t_&#123;sim&#125;</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's1' }} min={0.1} max={100.0} step={0.1} value={globalVars.simulationTime} onChange={onSimulationTimeChange} />
          <Box sx={{ gridArea: 't2' }}><InlineMath>t_&#123;sample&#125;</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's2' }} min={0.01} max={1.0} step={0.01} value={globalVars.samplingTime} onChange={onSamplingTimeChange} />

          <Box sx={{ gridArea: 't3' }}><InlineMath>K_p</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's3' }} min={0.1} max={10.0} step={0.1} value={processVars.gain} onChange={onProcessGainChange} />
          <Box sx={{ gridArea: 't4' }}><InlineMath>\tau_p</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's4' }} min={0.0} max={10.0} step={0.1} value={processVars.timeConstant} onChange={onProcessTimeConstantChange} />
          <Box sx={{ gridArea: 't5' }}><InlineMath>\theta_p</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's5' }} min={0.0} max={10.0} step={0.1} value={processVars.delay} onChange={onProcessDelayChange} />

          <Box sx={{ gridArea: 't6' }}><InlineMath>K_c</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's6' }} min={0.1} max={10.0} step={0.1} value={controllerVars.Kc} onChange={onKcChange} />
          <Box sx={{ gridArea: 't7' }}><InlineMath>\tau_i</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's7' }} min={0.0} max={10.0} step={0.1} value={controllerVars.Ti} onChange={onTiChange} />
          <Box sx={{ gridArea: 't8' }}><InlineMath>\tau_d</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's8' }} min={0.0} max={10.0} step={0.1} value={controllerVars.Td} onChange={onTdChange} />
          <Divider sx={{ gridArea: 'd' }} />
          <Box sx={{ gridArea: 't9' }}><InlineMath>K_p</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's9' }} min={0.1} max={10.0} step={0.1} value={controllerVars.Kc} onChange={onKpChange} />
          <Box sx={{ gridArea: 't10' }}><InlineMath>K_i</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's10' }} min={0.0} max={10.0 * controllerVars.Kc} step={0.1} value={controllerVars.Ti * controllerVars.Kc} onChange={onKiChange} />
          <Box sx={{ gridArea: 't11' }}><InlineMath>K_d</InlineMath></Box>
          <InputSlider sx={{ gridArea: 's11' }} min={0.0} max={10.0 * controllerVars.Kc} step={0.1} value={controllerVars.Td * controllerVars.Kc} onChange={onKdChange} />
        </Box>
        <Box sx={{
          display: 'grid',
          gridTemplateRows: '1fr 1fr',
          gridTemplateColumns: '600px',
          alignContent: 'start',
          overflow: 'hidden'
        }}>
          <Plotter2 data={processData} />
          <Plotter2 data={controllerData} />
        </Box>
      </Box> */}
    </>
  );
}

export default App;
