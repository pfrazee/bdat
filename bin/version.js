var path = require('path')
var fs = require('fs')
var semver = require('semver')

module.exports = function (args) {
  // read current version-file
  var version
  var versionFile = path.join(args.dir || '.', '.bdat-version')
  try {
    version = semver.clean(fs.readFileSync(versionFile, 'utf-8'))
  } catch (e) {}
  if (!version)
    version = '0.0.0'

  if (!args._[1]) {
    // output current
    console.log(version)
  } else {
    // update current
    var change = args._[1]
    if (['major', 'minor', 'patch', 'prerelease'].includes(change))
      version = semver.inc(version, change)
    else if (semver.valid(change)) {
      if (semver.gt(change, version))
        version = change
      else {
        console.log('Error: New version must be greater than current,', version)
        process.exit(1)
      }
    } else {
      console.log('Error: Invalid semver,', change)
      process.exit(1)
    }

    // write to file
    try {
      fs.writeFileSync(versionFile, version, 'utf-8')
      console.log('Dat version updated:', version)
    } catch (e) {
      console.log('Failed to write new version')
      console.log(e)
      process.exit(1)
    }
  }
  process.exit(0)
}
