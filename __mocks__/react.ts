import * as React from "react"
export { default } from "react"

const memo = (fn: any) => fn
module.exports = { ...React, memo }
