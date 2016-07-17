var path = require('path')
var fs = require('fs')
var semver = require('semver')
var Dat = require('dat/lib/dat')
var append = require('dat/lib/append')
var vfilelib = require('bdat-versions-file')
var stringToStream = require('string-to-stream')
var mkdirp =  require('mkdirp')

const VFILENAME = '.bdat/versions.json.log'

module.exports = function (args) {
  args.dir = process.cwd()
  var dat = Dat(args)

  dat.on('error', onerror)
  dat.on('ready', () => {
    // read current version-file
    var vfileData = ''
    var vfilePath = path.join(args.dir, VFILENAME)
    try {
      vfileData = fs.readFileSync(vfilePath, 'utf-8')
    } catch (e) {}
    vfilelib.parse(vfileData, (err, vfile) => {

      // load current db state
      dat.archive.metadata.open(err => {
        dat.archive.metadata.head((err, hash, changeNumber) => {
          if (err || !hash || !changeNumber) {
            console.log('Error: failed to read .dat state')
            console.log(err || 'No history data found')
            process.exit(1)
          }

          // update current
          var newVersion = args._[1]
          var message = args.message
          try {
            vfile.append({ version: newVersion, change: changeNumber, hash: hash.toString('hex'), message })
          } catch (e) {
            console.log(e.toString())
            process.exit(1)
          }

          // write to file
          try {
            vfileData = vfile.toString()
            mkdirp.sync(path.dirname(vfilePath))
            fs.writeFileSync(vfilePath, vfileData, 'utf-8')
          } catch (e) {
            console.log('Failed to write new version')
            console.log(e)
            process.exit(1)
          }

          // write to dat db
          append.liveAppend(dat, { type: 'file', relname: VFILENAME, filepath: vfilePath, stat: { size: 0 } })
          console.log('Dat version updated:', vfile.current)/*
          var s = stringToStream(vfileData)
          s.pipe(dat.archive.createFileWriteStream({type: 'file', name: VFILENAME}))
          s.on('end', () => {
            // done
            console.log('Dat version updated:', vfile.current)
            process.exit(0)
          })*/
        })
      })
    })
  })
}

function onerror (err) {
  console.error(err.stack || err)
  process.exit(1)
}