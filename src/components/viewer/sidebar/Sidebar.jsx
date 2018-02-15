import React from 'react'
import { withRouter, Route } from 'react-router-dom'
import { css, StyleSheet } from 'aphrodite/no-important'

import { IconLink } from './menuIcons'
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
    },
  })

  return (
    <section className={css(styles.sidebar)}>
      <div className={css(styles.menu)}>
        <IconLink replace to={`${match.url}`} name="information-variant" />
        <IconLink replace to={`${match.url}/related`} name="math-compass" />
        <IconLink replace to={`${match.url}/config`} name="settings" />
        <IconLink
          replace
          to={`${match.url}/list`}
          name="format-list-bulleted"
        />
        <IconLink to="/" name="home" />
      </div>
      <Route
        exact
        path={match.url}
        component={() => <ComponentInfo solid={solid} />}
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
