import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import HackathonWins from './HackathonWins.tsx'
import ProjectsPage from './ProjectsPage.tsx'
import MediaPage from './MediaPage.tsx'
import TeamPage from './TeamPage.tsx'
import HackathonClubPage from './HackathonClubPage.tsx'

const pathname = window.location.pathname

const isHackathonWinsPage =
  pathname === '/wins' ||
  pathname.endsWith('/wins') ||
  pathname.includes('/wins/')

const isProjectsPage =
  pathname === '/projects' ||
  pathname.endsWith('/projects') ||
  pathname.includes('/projects/')

const isMediaPage =
  pathname === '/media' ||
  pathname.endsWith('/media') ||
  pathname.includes('/media/')

const isTeamPage =
  pathname === '/team' ||
  pathname.endsWith('/team') ||
  pathname.includes('/team/')

const isHackathonClubPage =
  pathname === '/club/hackathon' ||
  pathname.endsWith('/club/hackathon') ||
  pathname.includes('/club/hackathon/')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isHackathonWinsPage ? (
      <HackathonWins />
    ) : isProjectsPage ? (
      <ProjectsPage />
    ) : isMediaPage ? (
      <MediaPage />
    ) : isTeamPage ? (
      <TeamPage />
    ) : isHackathonClubPage ? (
      <HackathonClubPage />
    ) : (
      <App />
    )}
  </StrictMode>,
)
