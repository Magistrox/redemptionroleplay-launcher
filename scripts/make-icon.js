const pngToIco = require('png-to-ico');
const fs   = require('fs');
const path = require('path');

const src  = path.join(__dirname, '../assets/img/logo.png');
const dest = path.join(__dirname, '../assets/img/logo.ico');

pngToIco(src)
  .then(buf => { fs.writeFileSync(dest, buf); console.log('✔ logo.ico généré'); })
  .catch(err => { console.error(err); process.exit(1); });
