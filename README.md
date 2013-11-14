hoodie-plugin-plugins [![Dependency Status](https://david-dm.org/alanshaw/hoodie-plugin-plugins.png)](https://david-dm.org/alanshaw/hoodie-plugin-plugins)
===
> A database with all the hoodie plugins in it.

This [hoodie](http://hood.ie/) plugin adds a database called "hoodie-plugin-plugins" that is initially populated with hoodie plugin records from an NPM search for "hoodie-plugin-". It uses [couchwatch](https://github.com/mikeal/couchwatch) to receive changes from NPM and updates or adds plugin docs to the database accordingly.

You can use the plugin in your hoodie app like this:

```javascript
var store = hoodie.open("hoodie-plugin-plugins")

store.connect()

store.findAll("plugin").done(function (plugins) {
  // Render, or whatever
})
```