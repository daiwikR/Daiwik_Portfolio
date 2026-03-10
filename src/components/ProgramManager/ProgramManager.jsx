import { useState } from 'react'
import styles from './ProgramManager.module.css'
import ProgramIcon from './ProgramIcon'

const GAME_ICONS = [
  { id: 'tetris', label: 'Tetris', iconKey: 'tetris' },
  { id: 'snake', label: 'Snake', iconKey: 'snake' },
  { id: 'spaceinvaders', label: 'Space Invaders', iconKey: 'spaceinvaders' },
  { id: 'pong', label: 'Pong', iconKey: 'pong' },
  { id: 'breakout', label: 'Breakout', iconKey: 'breakout' },
  { id: 'minesweeper', label: 'Minesweeper', iconKey: 'minesweeper' },
  { id: 'asteroids', label: 'Asteroids', iconKey: 'asteroids' },
  { id: 'pacman', label: 'Pac-Man', iconKey: 'pacman' },
]

const APP_ICONS = [
  { id: 'terminal', label: 'Terminal', iconKey: 'terminal' },
  { id: 'musicplayer', label: 'Music Player', iconKey: 'musicplayer' },
  { id: 'readme', label: 'README.TXT', iconKey: 'readme' },
  { id: 'mspaint', label: 'Paint', iconKey: 'mspaint' },
]

const GROUPS = [
  { id: 'games', label: 'Games', icons: GAME_ICONS },
  { id: 'accessories', label: 'Accessories', icons: APP_ICONS },
  { id: 'startup', label: 'StartUp', icons: [] },
  { id: 'applications', label: 'Applications', icons: APP_ICONS },
  { id: 'main', label: 'Main', icons: [...GAME_ICONS, ...APP_ICONS] },
]

export default function ProgramManager({ onOpen }) {
  const [activeGroup, setActiveGroup] = useState('games')
  const [showMenu, setShowMenu] = useState(null)

  const activeIcons = GROUPS.find(g => g.id === activeGroup)?.icons ?? []

  return (
    <div className={styles.pm}>
      <div className={styles.menuBar}>
        {['File', 'Options', 'Window', 'Help'].map(m => (
          <button
            key={m}
            className={styles.menuItem}
            onClick={() => {
              if (m === 'Help') setShowMenu(m === showMenu ? null : m)
            }}
          >
            {m}
          </button>
        ))}
        {showMenu === 'Help' && (
          <div className={styles.dropdown} onMouseLeave={() => setShowMenu(null)}>
            <div className={styles.dropdownItem}>About Portfolio OS...</div>
            <div className={styles.dropdownDivider} />
            <div className={styles.dropdownItem}>Version 1.0</div>
          </div>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.groupWindow}>
          <div className={styles.groupTitleBar}>
            <span>{GROUPS.find(g => g.id === activeGroup)?.label ?? 'Games'}</span>
          </div>
          <div className={styles.iconGrid}>
            {activeIcons.map(icon => (
              <ProgramIcon
                key={icon.id}
                id={icon.id}
                label={icon.label}
                iconKey={icon.iconKey}
                onDoubleClick={onOpen}
              />
            ))}
            {activeIcons.length === 0 && (
              <div className={styles.emptyGroup}>No programs here.</div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.groupBar}>
        {GROUPS.map(g => (
          <button
            key={g.id}
            className={`${styles.groupBtn} ${activeGroup === g.id ? styles.groupActive : ''}`}
            onDoubleClick={() => setActiveGroup(g.id)}
            onClick={() => setActiveGroup(g.id)}
          >
            <div className={styles.groupBtnIcon}>▣</div>
            <span>{g.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
