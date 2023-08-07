import React, { useState } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Legend, Tooltip, ReferenceArea } from 'recharts';
import { Button } from '@mui/material';


export default function Plotter(props) {

  const [state, setState] = useState({
    left: 'dataMin',
    right: 'dataMax',
    refAreaLeft: '',
    refAreaRight: ''
  });

  const zoom = (event) => {
    let { refAreaLeft, refAreaRight } = state;

    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      setState({
        ...state,
        refAreaLeft: '',
        refAreaRight: '',
      });
      return;
    }

    // xAxis domain
    if (refAreaLeft > refAreaRight) {
      [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];
    }

    setState(() => ({
      ...state,
      refAreaLeft: '',
      refAreaRight: '',
      left: refAreaLeft,
      right: refAreaRight
    }));
  }

  const zoomOut = () => {
    setState({
      ...state,
      refAreaLeft: '',
      refAreaRight: '',
      left: 'dataMin',
      right: 'dataMax',
    });
  }

  const { left, right, refAreaLeft, refAreaRight } = state;

  const lines = props.keys.slice(1).map((key, id) => <Line key={id} type="linear" dot={false} dataKey={key} isAnimationActive={false} />);

  console.log(props, lines);

  return (
    <div>
      <Button variant="outlined" size="small" onClick={zoomOut}>Zoom Out</Button>
      <LineChart
        width={800}
        height={400}
        data={props.data}
        onMouseDown={(e) => setState({ ...state, refAreaLeft: e.activeLabel })}
        onMouseMove={(e) => state.refAreaLeft && setState({ ...state, refAreaRight: e.activeLabel })}
        onMouseUp={zoom}
        onClick={(e) => e.preventDefault() }
      >
        <CartesianGrid strokeDasharray="3" />
        <XAxis allowDataOverflow dataKey={props.keys[0]} domain={[left, right]} type="number" />
        <YAxis allowDataOverflow domain={([min, max]) => [(min-(max-min)*0.1).toFixed(1), (max+(max-min)*0.1).toFixed(1)] } type="number" />
        <Legend verticalAlign="top" />
        <Tooltip />
        {lines}
        {refAreaLeft && refAreaRight ? (
          <ReferenceArea x1={refAreaLeft} x2={refAreaRight} />
        ) : null}
      </LineChart>
    </div>
  );
}
