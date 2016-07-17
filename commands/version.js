var path = require('path')
var fs = require('fs')
var vfilelib = require('bdat-versions-file')

const VFILENAME = '.bdat/versions.json.log'

module.exports = function (args) {
  var dir = (!args.dir || args.dir === '.') ? process.cwd() : args.dir
  // read current version-file
  var vfileData = ''
  var vfilePath = path.join(dir, VFILENAME)
  try {
    vfileData = fs.readFileSync(vfilePath, 'utf-8')
  } catch (e) {}
  vfilelib.parse(vfileData, (err, vfile) => {
    // output
    console.log(vfile.current || '0.0.0')
    process.exit(0)

  })
}
