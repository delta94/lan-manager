import React, { useState, useCallback, useEffect } from 'react';
import { Sparklines, SparklinesLine, SparklinesSpots } from 'react-sparklines';

async function load() {
  const response = await fetch("/api/throughput");
  const json = await response.json();
  if(!json.error) return json.data;
  let err = new Error(json.message);
  err.data = json.data;
  throw err;
}

function swallowError(promise) {
  promise.catch((err)=> console.error(err));
}

export default function Throughput() {
  const [ downloadHistory, setDownloadHistory ] = useState(Array(15).fill(0));
  const [ uploadHistory, setUploadHistory ] = useState(Array(15).fill(0));

  const loadData = useCallback(()=> {
    swallowError(
      load()
        .then(({ rxSpeed, txSpeed })=> {
          setDownloadHistory((history)=> [...history, rxSpeed].slice(-15)); // Keep only 15 entries
          setUploadHistory((history)=> [...history, txSpeed].slice(-15)); // Keep only 15 entries
        })
    );
  }, []);

  // load data every second
  useEffect(()=> {
    loadData();
    const interval = setInterval(()=> loadData(), 1000);
    return ()=> clearInterval(interval);
  }, [loadData]);

  return (
    <div className="Throughput">
      <Speed history={downloadHistory} icon='arrow_downward' />
      <Speed history={uploadHistory} icon='arrow_upward' />
    </div>
  );
}

function round(number, precision) {
  const factor = Math.pow(10, precision);
  return Math.round(number * factor) / factor;
}

function Speed({ icon, history }) {
  let speed = history[history.length - 1]; // Show the last item in history as current speed
  speed = round(speed / (1024 * 1024), 2); // Convert to mbps
  return (
    <div className="Speed">
      <div className="Speed__bytes"><i className={`icon-${icon}`} /> {speed}</div>
      <div className="Speed__graph">
        <Sparklines data={history} height={25}>
          <SparklinesLine style={{ strokeWidth: 1, stroke: 'white', fill: 'white', fillOpacity: '.2'}} />
          <SparklinesSpots style={{ fill: 'white' }} />
        </Sparklines>
      </div>
      <div className="Speed__unit">Mbps</div>
    </div>
  );
}
