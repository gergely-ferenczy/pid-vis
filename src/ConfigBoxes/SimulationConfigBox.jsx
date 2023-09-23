import { InlineMath } from 'react-katex';
import { Box, Typography, Card, CardHeader, CardContent, FormControlLabel, Checkbox } from '@mui/material';
import InputSlider from '../InputSlider';

export default function SimulationConfigBox(props) {

  const {
    simulationParams,
    onSimulationTimeChange,
    onSamplingTimeChange,
    onStepReturnChange,
    onStepTimeChange
  } = props;

  return (
    <Card>
      <CardHeader title={<Typography>Simulation</Typography>} />
      <CardContent>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'min-content 1fr',
          columnGap: 1,
          alignItems: 'center'
        }}>
          <Box>
            <InlineMath>t_&#123;sim&#125;</InlineMath>
          </Box>
          <InputSlider min={0.1} max={100.0} step={0.1} value={simulationParams.simulationTime} onChange={onSimulationTimeChange} />
          <Box>
            <InlineMath>t_&#123;sample&#125;</InlineMath>
          </Box>
          <InputSlider min={0.01} max={1.0} step={0.01} value={simulationParams.samplingTime} onChange={onSamplingTimeChange} />
          <Box>
            <FormControlLabel
              control={<Checkbox checked={simulationParams.stepReturn} onChange={onStepReturnChange} />}
              label={<InlineMath>t_&#123;step&#125;</InlineMath>}
            />
          </Box>
          <InputSlider min={0.01} max={100.0} step={0.01} value={simulationParams.stepTime} disabled={!simulationParams.stepReturn}
            onChange={onStepTimeChange} />
        </Box>
      </CardContent>
    </Card>
  );
}
