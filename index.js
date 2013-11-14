var couchwatch = require("couchwatch")
  , npm = require("npm")

const dbName = "hoodie-plugin-plugins"

function initialImport (db, cb) {
  console.log("Initial plugins import")

  npm.load({}, function (er) {
    if (er) return cb(er)

    npm.commands.search(["hoodie-plugin-"], function (er, data) {
      if (er) return cb(er)

      Object.keys(data).forEach(function (id) {
        if (id.indexOf("hoodie-plugin-") != 0) return;

        db.add("plugin", {
            id: id
          , description: data[id].description
          , maintainers: data[id].maintainers
          , keywords: data[id].keywords
          , readme: data[id].words
          , version: data[id].version
          , time: data[id].time
        }, function (er) {
          if (er) return console.warn("Failed to add plugin", id, er)
          console.log("Added plugin", data[id])
        })
      })

      cb()
    })
  })
}

function watchAndUpdate (db, cb) {
  // TODO: use db to get changes since date and watch from that date

  var watcher = couchwatch("http://isaacs.iriscouch.com/registry", -1)

  watcher.on("row", function (change) {
    if (change.id.indexOf("hoodie-plugin-") != 0) {
      return console.log("Ignoring non hoodie plugin change", change.doc.name)
    }

    if (change.deleted) {
      return db.remove("plugin", change.id, function (er) {
        if (er) return console.error("Failed to remove plugin", change, er)
        console.log("Removed plugin", change.id)
      })
    }

    // Add or update the changed document
    db.find("plugin", change.id, function (er, doc) {
      if (er) console.warn(er)

      if (!doc) {
        return db.add("plugin", {
            id: change.id
          , description: change.doc.description
          , maintainers: change.doc.maintainers
          , keywords: change.doc.keywords
          , readme: change.doc.readme
          , version: change.doc["dist-tags"].latest
          , time: change.doc.time[change.doc["dist-tags"].latest]
        }, function (er) {
          if (er) return console.warn("Failed to add plugin", change, er)
          console.log("Added plugin", change.id)
        })
      }

      var updates = ["description", "maintainers", "keywords", "readme"].reduce(function (updates, key) {
        if (change.doc[key] !== undefined) {
          updates[key] = change.doc[key]
        }
        return updates
      }, {})

      if (change.doc["dist-tags"] && change.doc["dist-tags"].latest) {
        updates.version = change.doc["dist-tags"].latest
      }

      if (change.doc.time && updates.version && change.doc.time[updates.version]) {
        updates.time = change.doc.time[updates.version]
      }

      db.update("plugin", change.id, updates, function (er) {
        if (er) return console.warn("Failed to update plugin", change, er)
        console.log("Updated plugin", change.id)
      })
    })
  })
  
  watcher.on("error", function (er) {
    // Downgrade the error event from an EXIT THE PROGRAM to a warn log
    console.warn("couchwatch er", er)
  
    // Try again in a bit
    setTimeout(function () {
      watcher.init()
    }, 30 * 1000)
  })

  setImmediate(cb)
}

module.exports = function (hoodie, cb) {

  //hoodie.database.remove(dbName, function () {

  hoodie.database.findAll(function (er, dbs) {
    if (er) return cb(er)

    if (dbs.indexOf(dbName) == -1) {

      hoodie.database.add(dbName, function (er, db) {
        if (er) return cb(er)

        initialImport(db, function (er) {
          if (er) return cb(er)

          db.grantPublicReadAccess(function (er) {
            if (er) return cb(er)
            watchAndUpdate(db, cb)
          })
        })
      })

    } else {
      watchAndUpdate(hoodie.database("hoodie-plugin-plugins"), cb)
    }
  })

  //})
}