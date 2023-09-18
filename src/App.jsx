import { useState } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import { CssBaseline, Box, Typography, IconButton, Divider, Card, CardHeader, CardContent,
         Menu, MenuItem, FormControlLabel, Checkbox, Input, Popover } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { InfoOutlined as InfoIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import Alea from 'alea'
import Plotter from "./Plotter";
import InputSlider from './InputSlider';
import Fopdt from './Processes/Fopdt';
import Sopdt from './Processes/Sopdt';
import MassSpringDamper from './Processes/MassSpringDamper';
import WaterTank from './Processes/WaterTank';
import FolpFilter from './Filters/Folp';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import 'katex/dist/katex.min.css';
import './App.css';

function step(t, rt, st) {
  return t > 0.0 && (!rt || t < st) ? 1.0 : 0.0;
}

function pid(simulationParams, controllerParams, controllerState, r, y) {
  const { samplingTime: ts } = simulationParams;
  const { Kp, Ki, Kd } = controllerParams;
  const { ei: ei_prev, y: y_prev } = controllerState;


  const e = r - y;
  const ei = ei_prev + e;
  const yd = y - y_prev;
  const p = Kp * e;
  const i = Math.min(Math.max(Ki * ts * ei, controllerParams.i_min), controllerParams.i_max);
  const d = -Kd / ts * yd;
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
    noise: 0.0,
    filter: 0.0
  });

  const [processId, setProcessId] = useState(0);
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
        { label: 'Response', data: ticks.map((t, i) => ({x: t, y: process.tf(stepData[i].y)})) }
      ]
    };

    return result;
  }

  function generateControllerData(simulationParams, processId, processParams, controllerParams) {
    const controllerState = { ei: 0, y: 0, u: 0 };

    const { simulationTime: st, samplingTime: dt, noise: nc, filter: fa } = simulationParams;
    const ticks =  Array(Math.round((1.05 * st)/dt + 1)).fill().map((_, i) => -0.05 * st + dt * i);

    const process = new ProcessVariants[processId](processParams, dt);
    const prng = new Alea(0);
    const filter = new FolpFilter({ a: fa}, dt);

    const targetReference = Array(ticks.length);
    const controllerOutput = Array(ticks.length);
    const pOutput = Array(ticks.length);
    const iOutput = Array(ticks.length);
    const dOutput = Array(ticks.length);
    const processResponse = Array(ticks.length);
    const processResponseWithNoise = Array(ticks.length);

    ticks.map((t, k) => {
      const n = (prng() - 0.5) * 2 * nc;
      const y = process.tf(controllerState.u);
      const yn = y + n;
      const ynf = filter.tf(yn);
      const r = step(t, simulationParams.stepReturn, simulationParams.stepTime);
      const { u, p, i, d } = pid(simulationParams, controllerParams, controllerState, r, ynf);

      targetReference[k] = { x: t, y: r };
      controllerOutput[k] = { x: t, y: u };
      processResponse[k] = { x: t, y: y };
      processResponseWithNoise[k] = { x: t, y: yn };
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
        { label: 'y+n', data: processResponseWithNoise, hidden: true },
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

  function onFilterChange(event, newValue) {
    const newSimulationParams = {
      ...simulationParams,
      filter: newValue
    };
    setSimulationParams(newSimulationParams);
    updateData(newSimulationParams, processId, processParams, controllerParams);
  }

  function onKcChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Kp: newValue,
      Ki: controllerParams.Ki / controllerParams.Kp * newValue || 0.0,
      Kd: controllerParams.Kd / controllerParams.Kp * newValue || 0.0
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onTiChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Ki: newValue * controllerParams.Kp
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onTdChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Kd: newValue * controllerParams.Kp
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onKpChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Kp: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onKiChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Ki: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onKdChange(event, newValue) {
    const newControllerParams = {
      ...controllerParams,
      Kd: newValue
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

  function onIminChange(event) {
    let newValue = event.target.value === '' ? 0 : Number(event.target.value);
    const newControllerParams = {
      ...controllerParams,
      i_min: newValue
    };
    setControllerParams(newControllerParams);
    updateData(simulationParams, processId, processParams, newControllerParams);
  }

  function onImaxChange(event) {
    let newValue = event.target.value === '' ? 0 : Number(event.target.value);
    const newControllerParams = {
      ...controllerParams,
      i_max: newValue
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


  const [anchorElProcessConfig, setAnchorElProcessConfig] = useState(null);
  const processConfigOpen = Boolean(anchorElProcessConfig);

  function handleProcessConfigOpen(event) {
    setAnchorElProcessConfig(event.currentTarget);
  }

  function handleProcessConfigClose(newProcessId) {
    setAnchorElProcessConfig(null);

    if (newProcessId !== undefined) {
      const newProcessParams = ProcessVariants[newProcessId].defaultParams;
      const newControllerParams = newProcessParams.control;
      updateData(simulationParams, newProcessId, newProcessParams, newControllerParams);
      setProcessId(newProcessId);
      setProcessParams(newProcessParams);
      setControllerParams(newControllerParams);
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


  const [anchorElControllerInfo, setAnchorElControllerInfo] = useState(null);
  const controllerInfoOpen = Boolean(anchorElControllerInfo);

  function handleControllerInfoOpen(event) {
    setAnchorElControllerInfo(event.currentTarget);
  }

  function handleControllerInfoClose() {
    setAnchorElControllerInfo(null);
  }

  const Ti = (controllerParams.Kp != 0.0) ? controllerParams.Ki / controllerParams.Kp : 0.0;
  const Td = (controllerParams.Kp != 0.0) ? controllerParams.Kd / controllerParams.Kp : 0.0;

  return (
    <>
      <CssBaseline />
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '600px 1fr',
        columnGap: 2,
        padding: 1
      }}>
        <Box sx={{
          display: 'grid',
          gridAutoFlow: 'column',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto auto auto',
          alignContent: 'start',
          alignItems: 'start',
          gap: 1
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
                <>
                  <IconButton onClick={handleProcessInfoOpen}><InfoIcon /></IconButton>
                  <IconButton onClick={handleProcessConfigOpen}><MoreVertIcon /></IconButton>
                </>
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
            <Popover
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right', }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left', }}
              anchorEl={anchorElProcessInfo}
              open={processInfoOpen}
              onClose={handleProcessInfoClose}
            >
              <Box sx={{ p: 2, width: 700 }}>
                <Typography variant="h5">Controller Description</Typography>
                { ProcessVariants[processId].info }
              </Box>
            </Popover>
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
                <Box><InlineMath>f_&#123;\alpha&#125;</InlineMath></Box>
                <InputSlider min={0.0} max={1.0} step={0.01} value={simulationParams.filter} onChange={onFilterChange} />
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ gridArea: '1/2/4/2' }}>
            <CardHeader
              action={
                <IconButton onClick={handleControllerInfoOpen}><InfoIcon /></IconButton>
              }
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
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerParams.Kp} onChange={onKcChange} />
                <Box><InlineMath>\tau_i</InlineMath></Box>
                <InputSlider min={0.0} max={10.0 / controllerParams.Kp} step={0.1} value={Ti} onChange={onTiChange} />
                <Box><InlineMath>\tau_d</InlineMath></Box>
                <InputSlider min={0.0} max={10.0 / controllerParams.Kp} step={0.1} value={Td} onChange={onTdChange} />

                <Divider sx={{ gridColumn: '1 / span 2', my: 1 }} />

                <Box><InlineMath>K_p</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerParams.Kp} onChange={onKpChange} />
                <Box><InlineMath>K_i</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerParams.Ki} onChange={onKiChange} />
                <Box><InlineMath>K_d</InlineMath></Box>
                <InputSlider min={0.0} max={10.0} step={0.1} value={controllerParams.Kd} onChange={onKdChange} />

                <Divider sx={{ gridColumn: '1 / span 2', my: 1 }} />

                <Box><InlineMath>{'i_{min}'}</InlineMath></Box>
                <Box sx={{ textAlign: 'right', pt: 1 }}><Input value={controllerParams.i_min} size="small" onChange={onIminChange} inputProps={{ step: 0.1, type: 'number' }} sx={{ width: 50 }} /></Box>
                <Box><InlineMath>{'i_{max}'}</InlineMath></Box>
                <Box sx={{ textAlign: 'right', pt: 1 }}><Input value={controllerParams.i_max} size="small" onChange={onImaxChange} inputProps={{ step: 0.1, type: 'number' }} sx={{ width: 50 }} /></Box>
                <Box><InlineMath>{'u_{min}'}</InlineMath></Box>
                <Box sx={{ textAlign: 'right', pt: 1 }}><Input value={controllerParams.u_min} size="small" onChange={onUminChange} inputProps={{ step: 0.1, type: 'number' }} sx={{ width: 50 }} /></Box>
                <Box><InlineMath>{'u_{max}'}</InlineMath></Box>
                <Box sx={{ textAlign: 'right', pt: 1 }}><Input value={controllerParams.u_max} size="small" onChange={onUmaxChange} inputProps={{ step: 0.1, type: 'number' }} sx={{ width: 50 }} /></Box>
              </Box>
            </CardContent>
            <Popover
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right', }}
              transformOrigin={{ vertical: 'bottom', horizontal: 'left', }}
              anchorEl={anchorElControllerInfo}
              open={controllerInfoOpen}
              onClose={handleControllerInfoClose}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h5">Controller Description</Typography>
                <BlockMath>
                  {`
                    \\begin{array}{l}
                      \\begin{aligned}
                      e_k &= r_k - y_k \\\\
                      u_k &= K_p \\cdot e_k + K_i \\sum_{i=1}^{k} e_i - K_d \\left(y_k-y_{k-1} \\right)
                            = K_c \\left(e_k + T_i \\sum_{i=1}^{k} e_i - T_d \\left(y_k-y_{k-1} \\right) \\right) \\\\\\\\
                      \\end{aligned}\\\\
                      \\text{Where}
                    \\end{array}
                  `}
                </BlockMath>
                <Box className={'katex-small'}>
                  <BlockMath>
                    {`
                      \\begin{array}{ll}
                        \\begin{aligned}
                          & K_P && \\text{Proportional gain.} \\quad \\\\
                          & K_i && \\text{Integral gain.}     \\quad \\\\
                          & K_d && \\text{Derivative gain.}   \\quad \\\\
                        \\end{aligned}
                        \\begin{aligned}
                          & K_c && \\text{Global controller gain.} \\\\
                          & \\tau_i && \\text{Integral time constant.} \\\\
                          & \\tau_d && \\text{Derivative time constant.}
                        \\end{aligned}
                      \\end{array} \\\\
                      \\begin{aligned}
                        \\\\
                        & u_k && \\text{Controller output.} \\\\
                        & y_k && \\text{Process variable, output of the system.}\\\\
                        & r_k && \\text{Reference point, target value.} \\\\
                        & e_k && \\text{Calculated error.}
                      \\end{aligned}
                    `}
                  </BlockMath>
                </Box>
                <object data="control_loop.svg" width={900} />
              </Box>
            </Popover>
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
