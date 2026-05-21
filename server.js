const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 2048;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
};

http.createServer((req, res) => {
  let url = req.url.split('?')[0]; // strip query
  if (url === '/') url = '/index.html';

  // Security: prevent directory traversal
  url = url.replace(/\.\./g, '');

  const filePath = path.join(__dirname, url);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      console.log('404: ' + filePath);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found: ' + url);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
}).listen(PORT, () => {
  console.log('http://localhost:' + PORT);
});
