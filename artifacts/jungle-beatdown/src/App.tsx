import { useRef } from 'react';
import {
  AudioLines,
  VolumeX,
  Compass,
  Heart,
  Play,
  RotateCcw,
  Swords,
} from 'lucide-react';
import jungleBackground from '@assets/background_1791470375690.png';
import { useJungleGame } from './game/useJungleGame';

function formatScore(score: number) {
  return Math.max(0, score).toString().padStart(6, '0');
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { snapshot, startGame, restartGame, toggleSound, heroPortrait } = useJungleGame(canvasRef);
  const hpPercent = Math.max(0, Math.min(100, (snapshot.heroHp / snapshot.maxHeroHp) * 100));
  const escapePercent = Math.max(0, Math.min(100, snapshot.escapeProgress * 100));
  const isTitle = snapshot.phase === 'title';
  const isGrapple = snapshot.phase === 'grapple';
  const isSpecialDefeat = snapshot.phase === 'special-defeat';
  const isGroupDefeat = snapshot.phase === 'group-defeat';
  const isGameOver = snapshot.phase === 'game-over';
  const isPlaying = snapshot.phase === 'playing';
  const isDefeatSequence = isSpecialDefeat || isGroupDefeat;
  const sequencePercent = Math.max(0, Math.min(100,
    (snapshot.defeatSecondsLeft / (isSpecialDefeat ? 10 : 20)) * 100));

  return (
    <main className="game-shell">
      <div className="game-wrap">
        <header className="topline">
          <div className="brand-lockup">
            <div className="brand-mark" aria-hidden="true"><Compass /></div>
            <div>
              <div className="brand-name">ARQUIVO SELVAGEM</div>
              <div className="brand-sub">Uma aventura arcade na Amazônia</div>
            </div>
          </div>
          <div className="top-actions">
            {!isTitle && (
              <button className="restart-small" type="button" onClick={restartGame} data-testid="button-restart">
                <RotateCcw /> <span>Reiniciar</span>
              </button>
            )}
            <button
              className="sound-button"
              type="button"
              onClick={toggleSound}
              aria-label={snapshot.soundEnabled ? 'Desativar som' : 'Ativar som'}
              aria-pressed={snapshot.soundEnabled}
              data-testid="button-sound"
            >
               {snapshot.soundEnabled ? <AudioLines /> : <VolumeX />}
              <span className="sound-label">{snapshot.soundEnabled ? 'Som ligado' : 'Som desligado'}</span>
            </button>
          </div>
        </header>

        <section className="game-frame" aria-label="Jungle Beatdown">
          <div className="frame-topline">
            <span className="live-label"><i className="live-dot" /> Setor 01 <span>/</span> Ruínas da mata</span>
            <span>Modo arcade <span aria-hidden="true">·</span> 1 jogadora</span>
          </div>

          <div className="arena" style={{ backgroundImage: `url("${jungleBackground}")` }}>
            <canvas
              ref={canvasRef}
              width={1024}
              height={576}
              style={{ width: '100%', height: '100%' }}
              className="game-canvas"
              aria-label="Arena de combate na floresta"
              data-testid="game-canvas"
            />

            {!isTitle && (
              <div className="hud" aria-live="polite">
                <div className="hud-box">
                  <div className="hud-heading"><span><Heart size={12} /> Exploradora</span><strong>{snapshot.heroHp} / {snapshot.maxHeroHp}</strong></div>
                  <div className="hp-track"><div className="hp-fill" style={{ width: `${hpPercent}%` }} /></div>
                  <div className="enemy-track" aria-label={`${snapshot.activeEnemies} guerreiras ativas, ${snapshot.defeatedEnemies} derrotadas`}>
                    {Array.from({ length: 5 }, (_, index) => (
                      <i key={index} className={`enemy-pip ${index >= snapshot.activeEnemies ? 'down' : ''}`} />
                    ))}
                  </div>
                </div>
                <div className="hud-box score-box">
                  <div className="hud-heading"><span>Pontuação</span></div>
                  <div className="score-number" data-testid="text-score">{formatScore(snapshot.score)}</div>
                </div>
              </div>
            )}

            {isTitle && (
              <div className="state-overlay">
                <div className="title-content">
                  <div className="title-copy">
                    <div className="eyebrow">Briga de rua, trilha de selva</div>
                    <h1 className="game-title">Jungle <span>Beatdown</span></h1>
                    <p className="title-description">
                       Cinco guerreiras. Uma arena na selva. Mova-se, lute e sobreviva ao cerco por quanto tempo conseguir.
                    </p>
                    <button className="start-button" type="button" onClick={startGame} data-testid="button-start">
                      <Play fill="currentColor" /> Iniciar partida
                    </button>
                  </div>
                  <div className="title-art" aria-hidden="true">
                     {heroPortrait && <img className="hero-art" src={heroPortrait} alt="" />}
                    <div className="art-tag">Expedição em andamento · 01</div>
                  </div>
                </div>
              </div>
            )}

            {isGrapple && (
              <div className="sequence-hud grapple-hud" role="status" data-testid="status-grapple">
                <div className="sequence-info">
                  <span className="sequence-label">Agarrão</span>
                  <span className="sequence-hint"><kbd>J</kbd> Aperte para escapar</span>
                </div>
                <strong className="sequence-time">{Math.max(0, snapshot.grappleSecondsLeft).toFixed(1)}<small>s</small></strong>
                <div className="sequence-track" aria-label={`Fuga ${Math.round(escapePercent)}%`}>
                  <div className="sequence-fill" style={{ width: `${escapePercent}%` }} />
                </div>
              </div>
            )}

            {isDefeatSequence && (
              <div className="sequence-hud defeat-hud" role="status"
                data-testid={isSpecialDefeat ? 'status-special-defeat' : 'status-group-defeat'}>
                <div className="sequence-info">
                  <span className="sequence-label">{isSpecialDefeat ? 'Luta para se soltar' : 'Cerco das guerreiras'}</span>
                  <span className="sequence-hint">Sequência de derrota</span>
                </div>
                <strong className="sequence-time">{Math.max(0, snapshot.defeatSecondsLeft).toFixed(1)}<small>s</small></strong>
                <div className="sequence-track" aria-hidden="true">
                  <div className="sequence-fill" style={{ width: `${sequencePercent}%` }} />
                </div>
              </div>
            )}

            {isGameOver && (
              <div className="state-overlay">
                <div className="end-card" role="status" data-testid="status-game-over">
                  <p className="card-kicker">Expedição encerrada</p>
                  <h2 className="overlay-title">Fim de jogo</h2>
                  <p className="overlay-text">Pontuação final <strong>{formatScore(snapshot.score)}</strong></p>
                  <button className="primary-button" type="button" onClick={restartGame} data-testid="button-restart-game-over">
                    <RotateCcw /> Jogar novamente
                  </button>
                </div>
              </div>
            )}

            {isPlaying && (
              <div className="phase-chip">
                {`${snapshot.activeEnemies} ${snapshot.activeEnemies === 1 ? 'guerreira ativa' : 'guerreiras ativas'} · ${snapshot.defeatedEnemies} derrotadas`}
              </div>
            )}
          </div>

          <div className="controls-strip">
            <div className="control-title">Comandos de combate</div>
            <div className="control-list">
              <div className="control-item"><kbd>WASD</kbd><span>/</span><kbd>↑↓←→</kbd> Mover</div>
              <div className="control-item"><kbd>Shift</kbd> Correr</div>
              <div className="control-item"><kbd>J</kbd> Soco / escapar</div>
              <div className="control-item"><kbd>K</kbd> Chute</div>
              <div className="control-item"><kbd>Espaço</kbd> Pular</div>
            </div>
          </div>
        </section>
        <div className="footer-note"><Swords size={12} /> <span>5 guerreiras</span> · arena de combate 2.5D · feita para jogar</div>
      </div>
    </main>
  );
}

export default App;
