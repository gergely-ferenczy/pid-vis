import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors,
} from 'chart.js';
import ChartJSPluginZoom from 'chartjs-plugin-zoom';
import { Line } from 'react-chartjs-2';
import { Button, Box } from '@mui/material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Colors,
  ChartJSPluginZoom
);

export default function Plotter2(props) {
  const chartRef = React.useRef(null);

  const options = {
    responsive: true,
    animation: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 't',
          align: 'end'
        },
        min: props.data.limits.min
      },
      y: {
        type: 'linear',
        grace: '5%'
      }
    },
    plugins: {
      title: {
        display: true,
        text: props.data.title
      },
      legend: {
        position: 'top',
      },
      colors: {
        enabled: true
      },
      zoom: {
        limits: {
        },
        zoom: {
          wheel: {
            enabled: true
          },
          // drag: {
          //   enabled: true
          // },
          mode: 'x',
        },
        pan: {
          enabled: true,
          mode: 'x'
        }
      }
    }
  };

  const handleResetZoom = () => {
    if (chartRef.current) {
      chartRef.current.resetZoom();
    }
  };

  for (let i = 0; i < props.data.datasets.length; i++) {
    props.data.datasets[i].borderWidth = 1;
    props.data.datasets[i].pointStyle = 'circle';
    props.data.datasets[i].pointRadius = 1;
    props.data.datasets[i].pointHoverRadius = 1;
  }

  return (
    <Box sx={{ position: 'relative', overflow: 'hidden' }}>
      <Button sx={{ position: 'absolute', top: 1, right: 1 }} variant="outlined" size="small" onClick={handleResetZoom}>Reset zoom</Button>
      <Line ref={chartRef} options={options} data={props.data} />
    </Box>
  );
}
