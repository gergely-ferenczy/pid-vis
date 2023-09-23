import { Link, Typography } from '@mui/material';
import { BlockMath, InlineMath } from 'react-katex';

export default class {

  constructor(params, samplingTime) {
    this.Kp = params.Kp;
    this.Ts = params.Ts;
    this.Z = params.Z;
    this.d = params.d;
    this.dt = samplingTime;
    this.ua = Array(Math.floor(params.d / samplingTime) + 3).fill(0);
    this.ya = [0.0, 0.0];
  }

  tf(u) {
    const { Kp, Ts, Z, dt, ua, ya } = this;
    ua.splice(0, 1);
    ua.push(u);

    const a = 4*Ts*Ts / (dt*dt);
    const b = 4*Z*Ts / dt;
    let y = (Kp * (ua[2] + 2*ua[1] + ua[0]) - ya[1] * (-a*2 + 2) - ya[0] * (a - b + 1)) / (a + b + 1);
    ya[0] = ya[1];
    ya[1] = y;
    return y;
  }

  static title = "Second order plus dead time";

  static info =
  <>
    <Typography sx={{ mt: 2 }}>
      A second-order linear system is a common description of many dynamic processes. The response depends
      on whether it is an overdamped, critically damped, or underdamped second order system.
      It has four configurable variables, the gain <InlineMath>{`K_p`}</InlineMath>, time constant&nbsp;
      <InlineMath>{`\\tau_s`}</InlineMath>, damping ratio <InlineMath>{`\\zeta`}</InlineMath> and
      dead time <InlineMath>{`\\theta_p`}</InlineMath>.
    </Typography>
    <BlockMath>
      {`\\tau_s^2 \\ddot{y} + 2 \\zeta \\tau_s \\dot{y} + y = K_p u(t - \\theta_p)`}
    </BlockMath>
    <Typography variant='h6' sx={{ mt: 2 }}>Gain - <InlineMath>{`K_p`}</InlineMath></Typography>
    <Typography>
      The process gain is the change in the output <InlineMath>y</InlineMath> induced by a unit change in the input <InlineMath>u</InlineMath>.
      The process gain is calculated by evaluating the change in <InlineMath>y(t)</InlineMath> divided by the change in <InlineMath>u(t)</InlineMath>
      at steady state initial and final conditions.
    </Typography>
    <BlockMath>{`K_p = \\frac{\\Delta y}{\\Delta u} = \\frac{y_{ss_2} - y_{ss_1}}{u_{ss_2} - u_{ss_1}}`}</BlockMath>
    <Typography>The process gain affects the magnitude of the response, regardless of the speed of response.</Typography>
    <Typography variant='h6' sx={{ mt: 2 }}>Time constant - <InlineMath>{`\\tau_s`}</InlineMath></Typography>
    <Typography>
      The second order process time constant is the speed that the output response reaches a new steady state condition.
      The process time constant affects the speed of response.
    </Typography>
    <Typography variant='h6' sx={{ mt: 2 }}>Damping ratio - <InlineMath>{`\\zeta`}</InlineMath></Typography>
    <Typography>
      The response of the second order system to a step input in <InlineMath>{`u(t)`}</InlineMath> depends whether the system is
      overdamped <InlineMath>{`(\\zeta > 1)`}</InlineMath>, critically damped <InlineMath>{`(\\zeta = 1)`}</InlineMath>,
      or underdamped <InlineMath>{`(0 \\leq \\zeta < 1)`}</InlineMath>.
    </Typography>
    <Typography variant='h6' sx={{ mt: 2 }}>Dead time - <InlineMath>{`\\theta_p`}</InlineMath></Typography>
    <Typography>
      The dead time (or time delay) is expressed as a time shift in the input variable <InlineMath>{`u(t)`}</InlineMath>.
      <BlockMath>{`u(t-\\theta_p)`}</BlockMath>
    </Typography>
    <Typography sx={{ textAlign: 'right' }}>
      <Link href='https://apmonitor.com/pdc/index.php/Main/SecondOrderSystems' target='_blank' rel='noopener'>Source</Link>
    </Typography>
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
      name: 'Ts',
      title: '\\tau_s',
      min: 0.0,
      max: 10.0,
      step: 0.1
    },
    {
      name: 'Z',
      title: '\\zeta',
      min: 0.0,
      max: 10.0,
      step: 0.1
    },
    {
      name: 'd',
      title: '\\theta_p',
      min: 0.0,
      max: 10.0,
      step: 0.1
    }
  ];

  static defaultParams = {
    Kp: 1.0,
    Ts: 0.6,
    Z: 0.2,
    d: 0.5,
    control: {
      Kp: 0.1,
      Ki: 0.35,
      Kd: 0.15,
      dkp: true,
      i_min: -10.0,
      i_max: 10.0,
      u_min: -10.0,
      u_max: 10.0
    }
  };
}