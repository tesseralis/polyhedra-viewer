import React from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { setFilterText } from '../actions'
import { getFilteredGroups } from '../reducers/filter'

import Table from '../components/Table'

const Index = ({ setFilterText, groups }) => {
  return (
    <Table setFilterText={setFilterText} groups={groups} />
  )
}

const mapStateToProps = state => ({
  groups: getFilteredGroups(state.filter),
})

const mapDispatchToProps = dispatch => bindActionCreators({ setFilterText }, dispatch)

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Index)
