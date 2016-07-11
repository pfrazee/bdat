var path = require('path')
var fs = require('fs')
var semver = require('semver')
var hyperdrive = require('hyperdrive')
var raf = require('random-access-file')
var vfilelib = require('bdat-versions-file')

const VFILENAME = '.bdat-versions'

module.exports = function (args) {
  var key = args.key
  if (!key) {
    console.log('Error: Not a dat archive')
    process.exit(1)
  }
  var dir = (!args.dir || args.dir === '.') ? process.cwd() : args.dir
  var db = args.level
  var drive = hyperdrive(db)
  var archive = drive.createArchive(Buffer(key, 'hex'), {
    file: function (name) {
      return raf(path.join(dir, name), {readable: true, writable: false})
    }
  })

  // read current version-file
  var vfileData = ''
  var vfilePath = path.join(dir, VFILENAME)
  try {
    vfileData = fs.readFileSync(vfilePath, 'utf-8')
  } catch (e) {}
  var vfile = vfilelib.parse(vfileData)

  if (!args._[1]) {
    // output current
    console.log(vfile.current || '0.0.0')
    process.exit(0)
  } else {
    // load current db state
    archive.metadata.open(err => {
      archive.metadata.head((err, hash, changeNumber) => {
        if (err || !hash || !changeNumber) {
          console.log('Error: failed to read .dat state')
          console.log(err || 'No history data found')
          process.exit(1)
        }

        // update current
        var newVersion = args._[1]
        try {
          vfile.append(newVersion, changeNumber, hash.toString('hex'))
        } catch (e) {
          console.log(e.toString())
          process.exit(1)
        }

        // write to file
        try {
          fs.writeFileSync(vfilePath, vfile.toString(), 'utf-8')
        } catch (e) {
          console.log('Failed to write new version')
          console.log(e)
          process.exit(1)
        }

        // update dat db
        archive.append({type: 'file', name: VFILENAME}, () => {
          // done
          console.log('Dat version updated:', vfile.current)
          process.exit(0)
        })
      })
    })
  }
}
