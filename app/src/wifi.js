const React = require('react');
const { useState, useEffect } = React;

async function getInfo() {
  const res = await fetch('/api/guest-wifi');
  if(res.status !== 200) throw new Error(res.statusText);
  const json = await res.json();
  return json.data;
}

module.exports = function Wifi() {
  const [ name, setName ] = useState('Loading');
  const [ password, setPassword ] = useState('Loading');

  useEffect(()=> {
    getInfo()
      .then((info)=> {
        setName(info.name);
        setPassword(info.password);
      })
      .catch((err)=> console.error(err));
  }, []);

  return (
    <div className="Wifi">
      <div className="Wifi__icon">
        <i className="icon-wifi"></i>
      </div>
      <div className="Wifi__name">{name}</div>
      <div className="Wifi__password">{password}</div>
    </div>
  );
}
