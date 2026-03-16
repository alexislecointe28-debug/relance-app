const fs = require('fs')
const path = require('path')

const version = {
  version: Date.now().toString(),
  buildTime: new Date().toISOString(),
}

fs.writeFileSync(
  path.join(__dirname, '../public/version.json'),
  JSON.stringify(version)
)

console.log('Version generated:', version.version)
