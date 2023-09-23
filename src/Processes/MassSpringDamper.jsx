import { Box, Typography, Link } from '@mui/material';
import { InlineMath } from 'react-katex';

export default class {

  constructor(params, samplingTime) {
    this.F = params.F;
    this.k = params.k;
    this.c = params.c;
    this.m = params.m;
    this.dt = samplingTime;
    this.ua = Array(3).fill(0);
    this.ya = [0.0, 0.0];
  }

  tf(u) {
    const { F, k, c: dc, m, dt, ua, ya } = this;
    ua.splice(0, 1);
    ua.push(u * F / m);

    const w = Math.sqrt(k/m);
    const Z = dc / (2*m*w);

    const a = 4 / (dt*dt);
    const b = 4*Z*w / dt;
    const c = w*w;
    let y = ((ua[2] + 2*ua[1] + ua[0]) - ya[1] * (-a*2 + 2) - ya[0] * (a - b + c)) / (a + b + c);
    ya[0] = ya[1];
    ya[1] = y;
    return y;
  }

  static title = "Mass spring damper";

  static info =
  <>
    <Box sx={{ mt: 2, mb: 2, display: 'grid', gridTemplateColumns: 'auto auto' }}>
      <Typography>
        The mass-spring-damper model consists of discrete mass nodes distributed throughout an object and
        interconnected via a network of springs and dampers. This model is well-suited for modelling objects
        with complex material properties such as nonlinearity and viscoelasticity.
      </Typography>
      <Box sx={{ mt: '-10px' }}><img src="mass_spring_damper.svg" /></Box>
    </Box>
    <Typography>Sum of forces applied on the mass:</Typography>
    <Typography><InlineMath>{`F_s = -k x`}</InlineMath> is the spring force, where <InlineMath>k</InlineMath> is the spring constant.</Typography>
    <Typography><InlineMath>{`F_d = -c \\dot{x}`}</InlineMath> is the damping force, where <InlineMath>c</InlineMath> is the damping coefficient.</Typography>
    <InlineMath>{`\\sum{F} = -kx - c \\dot{x} + F_{external} = m \\ddot{x}`}</InlineMath>
    <Typography sx={{ mt: 2 }}>By rearranging this equation, we can derive the standard form:</Typography>
    <Typography><InlineMath>{`\\ddot{x} + 2 \\zeta \\omega_n \\dot{x} + \\omega_n^2 x = u
    \\text{ where } \\omega_n = \\sqrt{\\frac{k}{m}} \\text{; } \\zeta = \\frac{c}{2 m \\omega_n}
    \\text{; } u = \\frac{F_{external}}{m}`}</InlineMath></Typography>
    <Typography sx={{ mt: 2 }}>
    <InlineMath>{`\\omega_n`}</InlineMath> is the undamped natural frequency and <InlineMath>{`\\zeta`}</InlineMath> is the damping ratio.
    </Typography>
    <Typography sx={{ textAlign: 'right' }}>
      <Link href='https://en.wikipedia.org/wiki/Mass-spring-damper_model' target='_blank' rel='noopener'>Source</Link>
    </Typography>
  </>

  static paramDefinitions = [
    {
      name: 'F',
      title: 'F',
      min: 0.1,
      max: 10.0,
      step: 0.1
    },
    {
      name: 'k',
      title: 'k',
      min: 0.1,
      max: 10.0,
      step: 0.1
    },
    {
      name: 'c',
      title: 'c',
      min: 0.0,
      max: 10.0,
      step: 0.1
    },
    {
      name: 'm',
      title: 'm',
      min: 0.1,
      max: 10.0,
      step: 0.1
    }
  ];

  static defaultParams = {
    F: 1.0,
    k: 1.0,
    c: 1.0,
    m: 1.0,
    control: {
      Kp: 0.1,
      Ki: 3.5,
      Kd: 1.5,
      dkp: true,
      i_min: -10.0,
      i_max: 10.0,
      u_min: -10.0,
      u_max: 10.0
    }
  };
}