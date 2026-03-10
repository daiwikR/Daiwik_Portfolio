import styles from './GameOver.module.css'

export default function GameOver({ score, highScore, onRestart, message }) {
  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.titleBar}>
          <span>Game Over</span>
        </div>
        <div className={styles.body}>
          <div className={styles.icon}>💀</div>
          <div className={styles.msg}>{message ?? 'GAME OVER'}</div>
          <div className={styles.scores}>
            <div>Score: {score}</div>
            {highScore > 0 && <div>Best: {highScore}</div>}
          </div>
          <button className={styles.okBtn} onClick={onRestart} autoFocus>
            [ OK — PLAY AGAIN ]
          </button>
        </div>
      </div>
    </div>
  )
}
