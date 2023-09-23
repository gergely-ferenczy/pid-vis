import { Box, Typography } from '@mui/material';
import { BlockMath } from "react-katex";

export default class {

  constructor(params, samplingTime) {
    this.ci = params.ci;
    this.co = params.co;
    this.A = params.A;
    this.dt = samplingTime;
    this.y = 0.0;
    this.u = 0.0;
    this.i = 0;
  }

  tf(u) {
    const { ci, co, A, dt, u: u_prev, y: y_prev } = this;
    u = Math.min(Math.max(u, 0.0), 1.0);
    const y = Math.max((ci * (u + u_prev) / 2 - co) / 1000 / A * dt + y_prev, 0.0);
    this.y = y;
    this.u = u;
    return y;
  }

  static title = "Water tank level";

  static info =
  <>
    <Typography sx={{ mt: 2 }}>
      A simple model of a water tank with a controllable inlet and a constant flow outlet.
      The controlled parameter is the height of the water column in the tank.
    </Typography>
    <Box sx={{ mb: 2, display: 'grid', gridTemplateColumns: 'auto auto' }}>
      <Box>
        <BlockMath>{`\\frac{\\delta h}{ \\delta t} = \\frac{c_i \\ u - c_o}{A}`}</BlockMath>
        <Box className={'katex-small'}>
          <BlockMath>
            {`
              \\begin{aligned}
              & h && \\text{Water tank level [m]} \\\\
              & A && \\text{Water tank base area [m2]} \\\\
              & c_i && \\text{Maximum inlet valve flow rate [l/s]} \\\\
              & c_o && \\text{Outlet valve flow rate [l/s]} \\\\
            \\end{aligned}
            `}
          </BlockMath>
        </Box>
      </Box>
      <Box><img src="water_tank.svg" /></Box>
    </Box>
  </>

  static paramDefinitions = [
    {
      name: 'ci',
      title: 'c_i',
      min: 0.0,
      max: 20.0,
      step: 0.1
    },
    {
      name: 'co',
      title: 'c_o',
      min: 0.0,
      max: 20.0,
      step: 0.1
    },
    {
      name: 'A',
      title: 'A',
      min: 0.01,
      max: 0.04,
      step: 0.01
    }
  ];

  static defaultParams = {
    ci: 10.0,
    co: 0.0,
    A: 0.01,
    control: {
      Kp: 0.4,
      Ki: 0.0,
      Kd: 0.0,
      dkp: true,
      i_min: 0.0,
      i_max: 1.0,
      u_min: 0.0,
      u_max: 1.0
    }
  };
}