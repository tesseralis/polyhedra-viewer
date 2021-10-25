const withTM = require("next-transpile-modules")(["lodash-es"])

module.exports = withTM({
  pageExtensions: ["page.ts", "page.tsx"],
})
