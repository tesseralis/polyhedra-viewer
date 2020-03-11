import { set, cloneDeep } from "lodash"
import { createHookedContext } from "components/common"
import { defaultConfig } from "./configOptions"

type Actions = "setValue" | "reset"
export default createHookedContext<typeof defaultConfig, Actions>(
  {
    setValue: <T>(key: string, value: T) => state =>
      set(cloneDeep(state), key, value),
    reset: () => () => defaultConfig,
  },
  defaultConfig,
)
