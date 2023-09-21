import { useState } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import { Box, Typography, Card, CardHeader, CardContent, IconButton, Divider, Input,
         Popover, Link } from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import InputSlider from '../InputSlider';

export default function SimulationConfigBox(props) {

  const {
    controllerParams,
    onKcChange,
    onTiChange,
    onTdChange,
    onKpChange,
    onKiChange,
    onKdChange,
    onIminChange,
    onImaxChange,
    onUminChange,
    onUmaxChange
  } = props;

  const Ti = (controllerParams.Kp != 0.0) ? controllerParams.Ki / controllerParams.Kp : 0.0;
  const Td = (controllerParams.Kp != 0.0) ? controllerParams.Kd / controllerParams.Kp : 0.0;

  const [anchorElControllerInfo, setAnchorElControllerInfo] = useState(null);
  const controllerInfoOpen = Boolean(anchorElControllerInfo);

  function handleControllerInfoOpen(event) {
    setAnchorElControllerInfo(event.currentTarget);
  }

  function handleControllerInfoClose() {
    setAnchorElControllerInfo(null);
  }

  return (
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
        <Box sx={{ p: 2, width: 'min-content' }}>
          <Typography variant="h5">Controller Description</Typography>
          <Typography>
            A proportional–integral–derivative controller (PID) is a control loop mechanism employing feedback that is
            widely used in industrial control systems and a variety of other applications requiring continuously modulated
            control. A PID controller continuously calculates an error value (<InlineMath>e(t)</InlineMath>) as the
            difference between a desired setpoint (<InlineMath>SP=r(t)</InlineMath>) and a measured process variable
            (<InlineMath>PV=y(t)</InlineMath>) and applies a correction based on proportional, integral, and derivative
            terms (denoted <InlineMath>P</InlineMath>, <InlineMath>I</InlineMath> and <InlineMath>D</InlineMath> respectively),
            hence the name.
          </Typography>
          <Typography sx={{ textAlign: 'right' }}>
            <Link href='https://en.wikipedia.org/wiki/Proportional%E2%80%93integral%E2%80%93derivative_controller'
                target='_blank' rel='noopener'>
              Source1
            </Link>
            &nbsp;&nbsp;
            <Link href='https://apmonitor.com/pdc/index.php/Main/ProportionalIntegralDerivative'
                target='_blank' rel='noopener'>
              Source2
            </Link>
          </Typography>
          <Typography sx={{ mt: 2 }}>
            The controller used in this example is slightly modified compared to the standard examples. It uses the
            process variable directly instead of the error value to calculate the derivative term to avoid kickback.
            It also has configurable saturation elements for the integral term and the controller output.
          </Typography>
          <Typography sx={{ mt: 2 }}>
            The error value is obtained by:
          </Typography>
          <BlockMath>{`e_k = r_k - y_k`}</BlockMath>
          <Typography>
            For practical purposes, this example only describes the discrete PID equation, as this is what will
            ultimately be implemented in code. The controller equation has two typical forms, which are equal in
            output, but the parameters are structured a bit differently. In the interactive example, both versions
            can be experimented with simultaneously.
          </Typography>
          <BlockMath>
            {`
              \\begin{array}{l}
                \\begin{aligned}
                u_k &= K_p \\cdot e_k + K_i \\sum_{i=1}^{k} e_i - K_d \\left(y_k-y_{k-1} \\right) & (1)\\\\
                u_k &= K_c \\left(e_k + T_i \\sum_{i=1}^{k} e_i - T_d \\left(y_k-y_{k-1} \\right) \\right) & (2) \\\\\\\\
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
          <object data="control_loop.svg" />
        </Box>
      </Popover>
    </Card>
  );
}
