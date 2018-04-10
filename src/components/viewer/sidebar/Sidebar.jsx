import React from 'react'
import { withRouter, Route, Redirect } from 'react-router-dom'
import { css, StyleSheet } from 'aphrodite/no-important'

import IconLink from './IconLink'
import ConfigForm from './ConfigForm'
import RelatedPolyhedra from './RelatedPolyhedra'
import PolyhedronList from './PolyhedronList'

const ComponentInfo = ({ solid }) => {
  return <div>This is a {solid}</div>
}

const Sidebar = ({ match, solid }) => {
  const styles = StyleSheet.create({
    sidebar: {
      width: 400,
      height: '100%',
      overflowY: 'scroll',
      backgroundColor: 'WhiteSmoke',
      boxShadow: 'inset -1px -1px 4px LightGray',
    },
    menu: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0 10px',
    },
  })

  return (
    <section className={css(styles.sidebar)}>
      <div className={css(styles.menu)}>
        <IconLink to="/" title="Home" iconName="home" exact />
        <IconLink
          replace
          to={`${match.url}/related`}
          title="Related"
          iconName="math-compass"
        />
        <IconLink
          replace
          to={`${match.url}/config`}
          title="Options"
          iconName="settings"
        />
        <IconLink
          replace
          to={`${match.url}/list`}
          title="List"
          iconName="format-list-bulleted"
        />
      </div>
      <Route
        exact
        path={match.url}
        render={() => <Redirect to={`${match.url}/related`} />}
      />
      <Route
        path={`${match.url}/related`}
        component={() => <RelatedPolyhedra solid={solid} />}
      />
      <Route path={`${match.url}/config`} component={ConfigForm} />
      <Route path={`${match.url}/list`} component={PolyhedronList} />
    </section>
  )
}

export default withRouter(Sidebar)
