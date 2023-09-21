import { useState } from "react";
import { InlineMath, BlockMath } from 'react-katex';
import { Box, Typography, Card, CardHeader, CardContent, IconButton, Divider, Input,
         Popover } from '@mui/material';
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
  );
}
