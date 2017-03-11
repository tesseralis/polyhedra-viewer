import React from 'react'
import { connect } from 'react-redux'

import { getFilteredGroups } from '../reducers/filter'
import Table from '../components/Table'

const Index = ({ groups }) => <Table groups={groups} />

const mapStateToProps = state => ({
  groups: getFilteredGroups(state.filter),
})

export default connect(mapStateToProps)(Index)
