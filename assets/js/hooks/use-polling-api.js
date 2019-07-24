import { useState, useEffect } from 'react';

export default function usePollingApi(url, pollInterval = 5000) {
  const [ error, setError ] = useState(null);
  const [ data, setData ] = useState(null);
  const [ loading, setLoading ] = useState(true);

  useEffect(()=> {
    function load() {
      fetch(url)
        .then(res=> {
          if(res.status !== 200) throw new Error(res.statusText);
          return res.json();
        })
        .then(json=> {
          if(json.error) {
            setError(new Error(json.message));
            setData(null);
          } else {
            setError(null);
            setData(json.data);
          }
          setLoading(false);
        })
        .catch(err=> {
          setError(err);
          setData(null);
          setLoading(false);
        });
    }

    load(); //Load initially
    const interval = setInterval(load, pollInterval); //Start interval
    return ()=> clearInterval(interval);
  }, [ url, pollInterval ]);

  return { error, data, loading };
}
