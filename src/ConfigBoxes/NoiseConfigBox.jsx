import { InlineMath } from 'react-katex';
import { Box, Typography, Card, CardHeader, CardContent, FormControlLabel, Checkbox } from '@mui/material';
import InputSlider from '../InputSlider';

export default function SimulationConfigBox(props) {

  const {
    simulationParams,
    onNoiseChange,
    onFilterChange
  } = props;

  return (
    <Card>
      <CardHeader title={<Typography>Noise</Typography>} />
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
  );
}
