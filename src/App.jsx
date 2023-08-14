import { useState } from "react";
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { CssBaseline, Box, Typography, IconButton, Divider, Card, CardHeader, CardContent,
         Menu, MenuItem, FormControlLabel, Checkbox, Input } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { InfoOutlined as InfoIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import Alea from 'alea'
import Plotter from "./Plotter";
import InputSlider from './InputSlider';
import Fopdt from './Processes/Fopdt';
import Sopdt from './Processes/Sopdt';
import MassSpringDamper from './Processes/MassSpringDamper';
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
  const u = Math.min(Math.max(p + i + d, controllerParams.u_min), controllerParams.u_max);
  controllerState.ei = ei;
  controllerState.y = y;
  controllerState.u = u;
  return { u, p, i, d };
}


const ProcessVariants = [ Fopdt, Sopdt, WaterTank, MassSpringDamper ];


function App() {
  const theme = useTheme();

  const [simulationParams, setSimulationParams] = useState({
    simulationTime: 20.0,
    samplingTime: 0.1,
    stepTime: 10.0,
    stepReturn: false,
    noise: 0.0
  });

  const [processId, setProcessId] = useState(3);
  const [processParams, setProcessParams] = useState(ProcessVariants[processId].defaultParams);

  const [controllerParams, setControllerParams] = useState(processParams.control);

  const [processData, setProcessData] = useState(generateProcessData(simulationParams, processId, processParams));
  const [controllerData, setControllerData] = useState(generateControllerData(simulationParams, processId, processParams, controllerParams));

  function generateProcessData(simulationParams, processId, processParams) {
    const { simulationTime: st, samplingTime: dt } = simulationParams;
    const ticks =  Array(Math.round((1.05 * st)/dt + 1)).fill().map((_, i) => -0.05 * st + dt * i);
    const stepData = ticks.map((t) => ({x: t, y: step(t, simulationParams.stepReturn, simulationParams.stepTime)}));

    const process = new ProcessVariants[processId](processParams, simulationParams.samplingTime);
    const prng = new Alea(0);

    const result = {
      title: 'Open loop response',
      limits: { min: ticks[0], max: ticks[ticks.length] },
      datasets: [
        { label: 'Input', data: stepData },
        { label: 'Response', data: ticks.map((t, i) => ({x: t, y: process.tf(stepData[i].y) + (prng() - 0.5) * 2 * simulationParams.noise})) }
      ]
    };

    return result;
  }

  function generateControllerData(simulationParams, processId, processParams, controllerParams) {
    const controllerState = { ei: 0, y: 0, u: 0 };

    const { simulationTime: st, samplingTime: dt } = simulationParams;
    const ticks =  Array(Math.round((1.05 * st)/dt + 1)).fill().map((_, i) => -0.05 * st + dt * i);

    const process = new ProcessVariants[processId](processParams, simulationParams.samplingTime);
    const prng = new Alea(0);

    const targetReference = Array(ticks.length);
    const controllerOutput = Array(ticks.length);
    const pOutput = Array(ticks.length);
    const iOutput = Array(ticks.length);
    const dOutput = Array(ticks.length);
    const processResponse = Array(ticks.length);

    ticks.map((t, k) => {
      const y = process.tf(controllerState.u) + (prng() - 0.5) * 2 * simulationParams.noise;
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

  function updateData(simulationParams, processId, processParams, controllerParams) {
    setProcessData(generateProcessData(simulationParams, processId, processParams));
    setControllerData(generateControllerData(simulationParams, processId, processParams, controllerParams));
  }

  function onSimulationTimeChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      simulationTime: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processId, processParams, controllerParams);
  }

  function onSamplingTimeChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      samplingTime: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processId, processParams, controllerParams);
  }

  function onStepTimeChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      stepTime: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processId, processParams, controllerParams);
  }

  function onStepReturnChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      stepReturn: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processId, processParams, controllerParams);
  }

  function onNoiseChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      noise: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processId, processParams, controllerParams);
  }

  function onKcChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Kc: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onTiChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Ti: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onTdChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Td: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onKpChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Kc: newValue,
      Ti: controllerParams.Kc * controllerParams.Ti / newValue,
      Td: controllerParams.Kc * controllerParams.Td / newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onKiChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Ti: newValue / controllerParams.Kc
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onKdChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Td: newValue / controllerParams.Kc
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onUminChange(event) {
    let newValue = event.target.value === '' ? 0 : Number(event.target.value);
    const newControllerParams = {
      ...controllerParams,
      u_min: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onUmaxChange(event) {
    let newValue = event.target.value === '' ? 0 : Number(event.target.value);
    const newControllerParams = {
      ...controllerParams,
      u_max: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onProcessVarChange(paramId, newValue) {
    let newProcessParams = { ...processParams };
    newProcessParams[paramId] = newValue;
    setProcessParams(newProcessParams);
    updateData(simulationParams, processId, newProcessParams, controllerParams);
  }

  const [anchorElProcessConfig, setAnchorSimConfigAction] = useState(null);
  const processConfigOpen = Boolean(anchorElProcessConfig);

  function handleProcessConfigOpen(event) {
    setAnchorSimConfigAction(event.currentTarget);
  }

  function handleProcessConfigClose(newProcessId) {
    setAnchorSimConfigAction(null);

    if (newProcessId !== undefined) {
      const newProcessParams = ProcessVariants[newProcessId].defaultParams;
      const newControllerParams = newProcessParams.control;
      updateData(simulationParams, newProcessId, newProcessParams, newControllerParams);
      setProcessId(newProcessId);
      setProcessParams(newProcessParams);
      setControllerParams(newControllerParams);
    }
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
            <CardHeader title={<Typography>Simulation configuration</Typography>} />
            <CardContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr',
                columnGap: 1,
                alignItems: 'center'
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
              subheader={ProcessVariants[processId].title}
            />
            <CardContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr',
                columnGap: 1,
                alignItems: 'center'
              }}>
                {
                  ProcessVariants[processId].paramDefinitions.map((p) => (
                    <Box key={p.name} sx={{ display: 'contents' }}>
                      <Box><InlineMath>{p.title}</InlineMath></Box>
                      <InputSlider min={p.min} max={p.max} step={0.1} value={processParams[p.name]} onChange={(e, v) => { onProcessVarChange(p.name, v) }} />
                    </Box>
                  ))
                }
              </Box>
            </CardContent>
            <Menu anchorEl={anchorElProcessConfig} open={processConfigOpen} onClose={() => {handleProcessConfigClose();}} >
              { ProcessVariants.map((p, i) => <MenuItem key={i} selected={ i==processId } onClick={() => {handleProcessConfigClose(i);}}>{p.title}</MenuItem>) }
            </Menu>
          </Card>
          <Card>
            <CardHeader title={<Typography>Noise configuration</Typography>} />
            <CardContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr',
                columnGap: 1,
                alignItems: 'center'
              }}>
                <Box><InlineMath>n_y</InlineMath></Box>
                <InputSlider min={0.0} max={1.0} step={0.01} value={simulationParams.noise} onChange={onNoiseChange} />
              </Box>
            </CardContent>
          </Card>
          <Card>
            <CardHeader
              title={<Typography>Controller configuration</Typography>}
            />
            <CardContent>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'min-content 1fr',
                columnGap: 1,
                alignItems: 'center'
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

                <Divider sx={{ gridColumn: '1 / span 2', my: 1 }} />

                <Box><InlineMath>u_&#123;min&#125;</InlineMath></Box>
                <Box sx={{ textAlign: 'right', pt: 1 }}><Input value={controllerParams.u_min} size="small" onChange={onUminChange} inputProps={{ step: 0.1, type: 'number' }} sx={{ width: 100 }} /></Box>
                <Box><InlineMath>u_&#123;max&#125;</InlineMath></Box>
                <Box sx={{ textAlign: 'right', pt: 1 }}><Input value={controllerParams.u_max} size="small" onChange={onUmaxChange} inputProps={{ step: 0.1, type: 'number' }} sx={{ width: 100 }} /></Box>
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
          <Plotter data={processData} />
          <Plotter data={controllerData} />
        </Box>
      </Box>
    </>
  );
}

export default App;
