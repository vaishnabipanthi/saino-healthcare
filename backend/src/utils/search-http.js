// Search routes ke liye chhota error helper (async errors Express tak pahuchate hain)
class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }
const wrap = (fn) => async (req, res) => {
  try { await fn(req, res); }
  catch (err) {
    if (err instanceof HttpError) return res.status(err.status).json({ success: false, error: err.message });
    console.error('Search failed:', err.message);
    res.status(500).json({ success: false, error: 'Search abhi kaam nahi kar rahi.' });
  }
};
module.exports = { HttpError, wrap };