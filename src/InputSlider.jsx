import React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Slider from '@mui/material/Slider';
import Input from '@mui/material/Input';


export default function InputSlider(props) {
  const theme = useTheme();

  const clamp = (value) => {
    let min = props.min || 0;
    let max = props.max || 100;
    return Math.min(Math.max(value, min), max);
  };

  const handleInputChange = (event) => {
    let newValue = clamp(event.target.value === '' ? 0 : Number(event.target.value));
    if (props.onChange !== undefined) {
      props.onChange(event, newValue);
    }
  };

  return (
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: 'auto 100px',
        padding: theme.spacing(),
        columnGap: theme.spacing(2),
        ...props.sx
      }}>
        <Slider size="small" min={props.min} max={props.max} step={props.step} value={props.value} onChange={props.onChange} />
        <Input
          value={props.value}
          size="small"
          onChange={handleInputChange}
          inputProps={{
            step: props.step || 1,
            min: props.min || 0,
            max: props.max || 100,
            type: 'number'
          }}
        />
      </Box>
  );
}