import { useState } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import { Box, Typography, Card, CardHeader, CardContent, IconButton, Divider, Input,
         Popover, Link, FormControlLabel, Checkbox } from '@mui/material';
import { InfoOutlined as InfoIcon } from '@mui/icons-material';
import InputSlider from '../InputSlider';

export default function SimulationConfigBox(props) {

  const {
    controllerParams,
    onKpChange,
    onKiChange,
    onKdChange,
    onDKPChange,
    onIminChange,
    onImaxChange,
    onUminChange,
    onUmaxChange,

    sx
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
    <Card sx={sx}>
      <CardHeader
        action={
          <IconButton onClick={handleControllerInfoOpen}><InfoIcon /></IconButton>
        }
        title={<Typography>Controller</Typography>}
      />
      <CardContent>
        <Box>
            <FormControlLabel
              control={<Checkbox size="small" checked={controllerParams.dkp} onChange={onDKPChange} />}
              label={'Derivative kickback prevention'}
            />
          </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          columnGap: 1,
          alignItems: 'center'
        }}>

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
        <Box sx={{ p: 2, width: '700px' }}>
          <Typography variant="h5">Controller Description</Typography>
          <Typography sx={{ mt: 2 }}>
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
          <Typography>Continous PID equation in standard form:</Typography>
          <BlockMath>{`u(t) = K_p \\ e(t) + K_i \\int_{0}^{t} e(t) + K_d \\frac{d}{dt} e(t)`}</BlockMath>
          <Typography>
            The error value is obtained by:
          </Typography>
          <BlockMath>{`e(t) = r(t) - y(t)`}</BlockMath>
          <Typography>
            This demonstration implements the discretized parallel (ideal) form of the PID controller.
          </Typography>
          <BlockMath>
            {`
              \\begin{array}{l}
                u_k = K_p \\ e_k + K_i \\ t_s \\sum_{j=0}^{k} e_j - \\frac{K_d}{t_s} \\left(e_k-e_{k-1} \\right) \\qquad\\qquad\\qquad\\quad
              \\end{array}
            `}
          </BlockMath>
          <Typography>
            Where
          </Typography>
          <Box className={'katex-small'}>
            <BlockMath>
              {`
                \\begin{array}{ll}
                  \\begin{aligned}
                    & u_k && \\text{Controller output.}                       \\quad \\\\
                    & y_k && \\text{Process variable, output of the system.}  \\quad \\\\
                    & r_k && \\text{Reference point, target value.}           \\quad \\\\
                    & e_k && \\text{Calculated error.}
                  \\end{aligned}
                  \\begin{aligned}
                    & K_P && \\text{Proportional gain.} \\\\
                    & K_i && \\text{Integral gain.}     \\\\
                    & K_d && \\text{Derivative gain.}   \\\\
                    & \\
                  \\end{aligned}
                \\end{array}
              `}
            </BlockMath>
          </Box>
          <Typography sx={{ mb: 2 }}>
            The controller used in this demonstration is slightly modified compared to the standard examples.
            <ul>
              <li>
                The derivative term can use both the calculated error and the process variable directly as its input. Using the process
                variable eliminates the issue commonly known as derivative kickback.
              </li>
              <li>
                The controller also has configurable saturation elements for the integral term and the controller output. This helps
                create more realistic configurations, where for example the output of the controller is limited by some kind of real
                life parameter.
              </li>
              <li>
                The integral term is accumulated after the multiplication with the integral gain. This way, if the integral gain
                is changed during the operation of the controller, the gain used for the already accumulated integral error will
                not change, the new gain value will only apply to new error samples.
              </li>
            </ul>
            The complete implementation in mathematical form:
          </Typography>
          <BlockMath>
            {`
              \\begin{array}{l}
                u_k = sat_{u_{min}}^{u_{max}}\\left(K_p \\ e_k + sat_{i_{min}}^{i_{max}}\\left(\\sum_{j=0}^{k} K_i \\ t_s \\ e_j \\right) - \\frac{K_d}{t_s} \\left(y_k-y_{k-1} \\right)\\right)
              \\end{array}
            `}
          </BlockMath>
        </Box>
      </Popover>
    </Card>
  );
}
