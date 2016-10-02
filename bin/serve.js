const fs = require('fs')
const async = require('async')
const level = require('level')

var argv = require('minimist')(process.argv.slice(2))
var opts = {webrtc: argv.webrtc}

const server = require('..')

var config = JSON.parse(fs.readFileSync(argv._[0]))
var keystore = {}
try {
  keystore = JSON.parse(fs.readFileSync(`${argv._[0]}.manifest`))
} catch (e) {

}

var servers = []
config.feeds.forEach(conf => {
  servers.push(serve(conf))
})

function serve (conf) {
  return (cb) => {
    server.serve(conf.url, Object.assign({}, opts, {key: keystore[conf.url], own: true}), cb)
  }
}

async.series(servers, (err, connections) => {
  if (err) throw (err)
  connections.forEach(conn => {
    console.log('serving', conn.url, 'at', conn.feed.key().toString('hex'))
    if (!keystore[conn.url]) keystore[conn.url] = conn.feed.key().toString('hex')
  })

  fs.writeFileSync(`${argv._[0]}.manifest`, JSON.stringify(keystore, undefined, 2))
})
