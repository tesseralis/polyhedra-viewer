import Graph from "./Graph"

import classicalGraph from "./classicalGraph"
import capstoneGraph from "./capstoneGraph"
import compositeGraph from "./compositeGraph"
import elementaryGraph from "./elementaryGraph"

export default new Graph()
  .apply(classicalGraph)
  .apply(capstoneGraph)
  .apply(compositeGraph)
  .apply(elementaryGraph)
