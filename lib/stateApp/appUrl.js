// const URL  = require("url").URL;

export  function appUrl(app, base, id, path = "") {
  console.log(`/${app}/${id}${path ? "/".concat(path) : path}`);
  console.log(base);
  return new URL(`/${app}/${id}${path ? "/".concat(path) : path}`, base).href
}
