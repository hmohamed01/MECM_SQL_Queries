import { useEffect, useState } from 'react'
import {
  Header,
  HeaderContainer,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuButton,
  HeaderName,
  HeaderPanel,
  RadioButton,
  RadioButtonGroup,
  SideNav,
  SideNavDivider,
  SideNavItems,
  SideNavLink,
  SkipToContent,
  Tag,
  Theme,
} from '@carbon/react'
import { ColorPalette, Renew } from '@carbon/icons-react'
import { refreshAllQueries, useStatus } from './lib/api.js'
import { DashboardPage } from './components/DashboardPage.jsx'
import { DASHBOARDS } from './dashboards/index.js'

// Like carbondesignsystem.com: light content themes sit under a white UI shell, dark ones under Gray 100.
const THEMES = [
  { id: 'white', name: 'White', shell: 'white' },
  { id: 'g10', name: 'Gray 10', shell: 'white' },
  { id: 'g90', name: 'Gray 90', shell: 'g100' },
  { id: 'g100', name: 'Gray 100', shell: 'g100' },
]
const DEFAULT_THEME = 'g10'
// Renamed when the default moved from Gray 100 to Gray 10, so earlier sessions start on the new default.
const THEME_STORAGE_KEY = 'mecm-carbon-content-theme'

// Only a known theme id is trusted: chart colors look the stored value up in @carbon/themes.
const readStoredTheme = () => {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
    return THEMES.some(({ id }) => id === storedTheme) ? storedTheme : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

const useStoredTheme = () => {
  const [theme, setTheme] = useState(readStoredTheme)
  useEffect(() => {
    document.documentElement.dataset.carbonTheme = theme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {
      // Storage can be unavailable in private windows; the theme still applies for this session.
    }
  }, [theme])
  return [theme, setTheme]
}

const currentRoute = () => window.location.hash.replace(/^#\/?/, '') || DASHBOARDS[0].id

const useHashRoute = () => {
  const [route, setRoute] = useState(currentRoute)
  useEffect(() => {
    const onHashChange = () => {
      setRoute(currentRoute())
      window.scrollTo({ top: 0 })
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return route
}

const DataSourceTag = ({ status }) => {
  if (!status) return null
  const isLive = status.mode === 'live'
  return (
    <Tag type={isLive ? 'green' : status.mode === 'offline' ? 'red' : 'purple'} size="md" className="data-source-tag">
      {isLive ? `Live · ${status.connection}` : status.connection}
    </Tag>
  )
}

const AppShell = ({ route, theme, onThemeChange }) => {
  const [isThemePanelOpen, setThemePanelOpen] = useState(false)
  const status = useStatus()

  return (
    <HeaderContainer
      render={({ isSideNavExpanded, onClickSideNavExpand }) => (
        <Header aria-label="MECM Fleet Reporting">
          <SkipToContent />
          <HeaderMenuButton
            aria-label={isSideNavExpanded ? 'Close menu' : 'Open menu'}
            onClick={onClickSideNavExpand}
            isActive={isSideNavExpanded}
            aria-expanded={isSideNavExpanded}
          />
          <HeaderName href="#/overview" prefix="MECM">
            Fleet Reporting
          </HeaderName>
          <HeaderGlobalBar>
            <DataSourceTag status={status} />
            <HeaderGlobalAction aria-label="Re-run all queries" tooltipAlignment="end" onClick={refreshAllQueries}>
              <Renew size={20} />
            </HeaderGlobalAction>
            <HeaderGlobalAction
              aria-label="Theme"
              tooltipAlignment="end"
              isActive={isThemePanelOpen}
              onClick={() => setThemePanelOpen((open) => !open)}
            >
              <ColorPalette size={20} />
            </HeaderGlobalAction>
          </HeaderGlobalBar>
          <HeaderPanel expanded={isThemePanelOpen} onHeaderPanelFocus={() => setThemePanelOpen(false)}>
            <RadioButtonGroup
              legendText="Content theme"
              name="content-theme"
              orientation="vertical"
              valueSelected={theme}
              onChange={(selectedTheme) => onThemeChange(selectedTheme)}
              className="theme-panel"
            >
              {THEMES.map(({ id, name }) => (
                <RadioButton key={id} id={`theme-${id}`} value={id} labelText={name} />
              ))}
            </RadioButtonGroup>
          </HeaderPanel>
          <SideNav aria-label="Dashboards" expanded={isSideNavExpanded} onSideNavBlur={onClickSideNavExpand} href="#/overview">
            <SideNavItems>
              {DASHBOARDS.map((dashboard, index) => (
                <div key={dashboard.id}>
                  {index === 1 && <SideNavDivider />}
                  <SideNavLink
                    renderIcon={dashboard.icon}
                    href={`#/${dashboard.id}`}
                    isActive={route === dashboard.id}
                    aria-current={route === dashboard.id ? 'page' : undefined}
                  >
                    {dashboard.navLabel}
                  </SideNavLink>
                </div>
              ))}
            </SideNavItems>
          </SideNav>
        </Header>
      )}
    />
  )
}

export const App = () => {
  const [theme, setTheme] = useStoredTheme()
  const route = useHashRoute()
  const position = Math.max(DASHBOARDS.findIndex((dashboard) => dashboard.id === route), 0)
  const dashboard = DASHBOARDS[position]
  const shellTheme = THEMES.find(({ id }) => id === theme)?.shell ?? 'white'

  useEffect(() => {
    document.title = `${dashboard.navLabel} · MECM Fleet Reporting`
  }, [dashboard])

  return (
    <>
      <Theme theme={shellTheme}>
        <AppShell route={dashboard.id} theme={theme} onThemeChange={setTheme} />
      </Theme>
      <Theme theme={theme} as="main" id="main-content" className="app-content">
        <DashboardPage key={dashboard.id} dashboard={dashboard} position={position + 1} total={DASHBOARDS.length} />
      </Theme>
    </>
  )
}
