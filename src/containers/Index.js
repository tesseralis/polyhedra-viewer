import React from 'react'
import { connect } from 'react-redux'

import { getFilteredGroups } from '../reducers'
import Table from '../components/Table'

const Index = ({ groups }) => <Table groups={groups} />

const mapStateToProps = state => ({
  groups: getFilteredGroups(state),
})

export default connect(mapStateToProps)(Index)
