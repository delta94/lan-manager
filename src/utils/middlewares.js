module.exports = (req, res, next)=> {

  res.apiSuccess = (data)=> {
    res.json({ success: true, error: false, data });
  };

  res.apiFail = ({ code = 500, data = {}, message = 'Server Error'} = {})=> {
    res.status(code);
    res.json({ success: false, error: true, data, message });
  };

  next();
}
