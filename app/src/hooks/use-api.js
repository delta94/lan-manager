import { useState, useEffect } from 'react';

export default function useApi(url) {
  const [ error, setError ] = useState(null);
  const [ data, setData ] = useState(null);
  const [ loading, setLoading ] = useState(true);

  useEffect(()=> {
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
  }, [ url ]);

  return { error, data, loading };
}
