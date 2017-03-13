import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'

import { configInputs } from '../constants/configOptions'
import { getConfigValues } from '../selectors'
import { setInputValue, reset } from '../actions'
import ConfigForm from '../components/ConfigForm'

const mapStateToProps = state => ({
  inputs: configInputs,
  inputValues: getConfigValues(state),
})

const mapDispatchToProps = dispatch => bindActionCreators({
  setInputValue,
  reset
}, dispatch)

export default connect(mapStateToProps, mapDispatchToProps)(ConfigForm)
