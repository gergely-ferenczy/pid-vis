import { Box, Link, Typography } from '@mui/material';
import { BlockMath, InlineMath } from 'react-katex';

export default class {

  constructor(params, samplingTime) {
    this.Kp = params.Kp;
    this.Tc = params.Tc;
    this.d = params.d;
    this.dt = samplingTime;
    this.ua = Array(Math.floor(params.d / samplingTime) + 2).fill(0);
    this.y = 0;
  }

  tf(u) {
    const { Kp, Tc, dt, ua, y: y_prev } = this;
    ua.splice(0, 1);
    ua.push(u);
    let y = (Kp * dt * (ua[0] + ua[1]) - (-2 * Tc + dt) * y_prev) / (2 * Tc + dt);
    this.y = y;
    return y;
  }

  static title = "First order plus dead time";

  static info =
  <>
    <Typography>
      A first-order linear system with time delay is a common empirical description of many stable dynamic processes.
      It has three configurable variables. the gain <InlineMath>{`K_p`}</InlineMath>, time constant&nbsp;
      <InlineMath>{`\\tau_p`}</InlineMath> and dead time <InlineMath>{`\\theta_p`}</InlineMath>.
    </Typography>
    <BlockMath>
      {`\\tau_p \\ \\dot y(t) = -y(t) + K_p u(t - \\theta_p)`}
    </BlockMath>
    <Typography variant='h6' sx={{ mt: 2 }}>Gain</Typography>
    <Typography>
      The process gain is the change in the output <InlineMath>y</InlineMath> induced by a unit change in the input <InlineMath>u</InlineMath>.
      The process gain is calculated by evaluating the change in <InlineMath>y(t)</InlineMath> divided by the change in <InlineMath>u(t)</InlineMath>
      at steady state initial and final conditions.
    </Typography>
    <BlockMath>{`K_p = \\frac{\\Delta y}{\\Delta u} = \\frac{y_{ss_2} - y_{ss_1}}{u_{ss_2} - u_{ss_1}}`}</BlockMath>
    <Typography>The process gain affects the magnitude of the response, regardless of the speed of response.</Typography>
    <Typography variant='h6' sx={{ mt: 2 }}>Time constant</Typography>
    <Typography>
      The process time constant is therefore the amount of time needed for the output to reach
      <InlineMath>{`(1 - e^{-1})`}</InlineMath> or <InlineMath>{`63.2\\%`}</InlineMath> of the way to steady state conditions.
      The process time constant affects the speed of response.
    </Typography>
    <Typography variant='h6' sx={{ mt: 2 }}>Dead time</Typography>
    <Typography>
      The dead time (or time delay) is expressed as a time shift in the input variable <InlineMath>{`u(t)`}</InlineMath>.
      <BlockMath>{`u(t-\\theta_p)`}</BlockMath>
    </Typography>
    <Typography><Link href='https://apmonitor.com/pdc/index.php/Main/FirstOrderSystems'>Source</Link></Typography>
  </>

  static paramDefinitions = [
    {
      name: 'Kp',
      title: 'K_p',
      description: 'Gain',
      min: 0.1,
      max: 10.0,
      step: 0.1
    },
    {
      name: 'Tc',
      title: '\\tau_c',
      description: 'Time constant',
      min: 0.0,
      max: 10.0,
      step: 0.1
    },
    {
      name: 'd',
      title: '\\theta_p',
      description: 'Delay',
      min: 0.0,
      max: 10.0,
      step: 0.1
    }
  ];

  static defaultParams = {
    Kp: 1.0,
    Tc: 0.6,
    d: 1.0,
    control: {
      Kp: 0.4,
      Ki: 0.52,
      Kd: 0.0,
      i_min: -10.0,
      i_max: 10.0,
      u_min: -10.0,
      u_max: 10.0
    }
  };
}