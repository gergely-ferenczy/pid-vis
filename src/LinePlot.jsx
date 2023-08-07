import * as Plot from "@observablehq/plot";
import { Box } from '@mui/material';
import {useRef, useEffect} from "react";

function LinePlot({
  data,
  width = 640,
  height = 400
}) {
  const containerRef = useRef();

  useEffect(() => {
    if (data === undefined) {
      return;
    }

    const plot = Plot.plot({
      y: { grid: true },
      x: { grid: true },
      color: { legend: true },
      inset: 10,
      width: width,
      height: height,
      style: {fontSize: "14px"},
      marks: [
        Plot.line(data, {x: 't', y: 'y', stroke: "title" })
      ]
    });
    containerRef.current.append(plot);
    return () => plot.remove();
  }, [data]);

  return <Box sx={{ fontSize: '14px' }} ref={containerRef} />;
}

export default LinePlot;
