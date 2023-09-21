import { useState } from "react";
import { CssBaseline, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Alea from 'alea'
import Plotter from "./Plotter";
import Fopdt from './Processes/Fopdt';
import Sopdt from './Processes/Sopdt';
import MassSpringDamper from './Processes/MassSpringDamper';
import WaterTank from './Processes/WaterTank';
import FolpFilter from './Filters/Folp';

import SimulationConfigBox from "./ConfigBoxes/SimulationConfigBox";
import ProcessConfigBox from "./ConfigBoxes/ProcessConfigBox";
import NoiseConfigBox from "./ConfigBoxes/NoiseConfigBox";
import ControllerConfigBox from "./ConfigBoxes/ControllerConfigBox";

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

  function onProcessChange(newProcessId) {
    const newProcessParams = ProcessVariants[newProcessId].defaultParams;
    const newControllerParams = newProcessParams.control;
    updateData(simulationParams, newProcessId, newProcessParams, newControllerParams);
    setProcessId(newProcessId);
    setProcessParams(newProcessParams);
    setControllerParams(newControllerParams);
  }

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
          <SimulationConfigBox simulationParams={simulationParams} onSimulationTimeChange={onSimulationTimeChange}
            onSamplingTimeChange={onSamplingTimeChange} onStepReturnChange={onStepReturnChange} onStepTimeChange={onStepTimeChange} />
          <ProcessConfigBox processVariants={ProcessVariants} processId={processId} processParams={processParams}
            onProcessChange={onProcessChange} onProcessVarChange={onProcessVarChange} />
          <NoiseConfigBox simulationParams={simulationParams} onNoiseChange={onNoiseChange} onFilterChange={onFilterChange} />
          <ControllerConfigBox controllerParams={controllerParams} onKcChange={onKcChange} onTiChange={onTiChange} onTdChange={onTdChange}
            onKpChange={onKpChange} onKiChange={onKiChange} onKdChange={onKdChange} onIminChange={onIminChange} onImaxChange={onImaxChange}
            onUminChange={onUminChange} onUmaxChange={onUmaxChange} />
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
