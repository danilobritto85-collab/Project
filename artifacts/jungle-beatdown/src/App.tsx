import { useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
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
import {
  NINJA_FOOTSMOTHER_DURATION,
  STATE_NINJA_FOOTSMOTHER,
  STATE_ROXY_HYPNO,
  STATE_ROXY_SMOTHER,
  useJungleGame,
} from './game/useJungleGame';

function formatScore(score: number) {
  return Math.max(0, score).toString().padStart(6, '0');
}

interface TouchButtonProps {
  code: string;
  label: string;
  glyph: string;
  caption?: string;
  className?: string;
  onPress: (code: string) => void;
  onRelease: (code: string) => void;
}

function TouchButton({
  code,
  label,
  glyph,
  caption,
  className = '',
  onPress,
  onRelease,
}: TouchButtonProps) {
  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    onRelease(code);
  };

  return (
    <button
      className={`touch-control-button ${className}`}
      type="button"
      aria-label={label}
      onPointerDown={(event) => {
        event.preventDefault();
        event.currentTarget.setPointerCapture(event.pointerId);
        onPress(code);
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={() => onRelease(code)}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="touch-control-glyph">{glyph}</span>
      {caption && <span className="touch-control-caption">{caption}</span>}
    </button>
  );
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    snapshot,
    startGame,
    restartGame,
    toggleSound,
    heroPortrait,
    pressVirtualControl,
    releaseVirtualControl,
  } = useJungleGame(canvasRef);
  const hpPercent = Math.max(0, Math.min(100, (snapshot.heroHp / snapshot.maxHeroHp) * 100));
  const escapePercent = Math.max(0, Math.min(100, snapshot.escapeProgress * 100));
  const isTitle = snapshot.phase === 'title';
  const isGrapple = snapshot.phase === 'grapple';
  const isSpecialDefeat = snapshot.phase === 'special-defeat';
  const isNinjaFootsmother = snapshot.phase === STATE_NINJA_FOOTSMOTHER;
  const isRoxyHypno = snapshot.phase === STATE_ROXY_HYPNO;
  const isRoxySmother = snapshot.phase === STATE_ROXY_SMOTHER;
  const isGroupDefeat = snapshot.phase === 'group-defeat';
  const isPlaying = snapshot.phase === 'playing';
  const isDefeatSequence = isSpecialDefeat || isNinjaFootsmother || isRoxyHypno ||
    isRoxySmother || isGroupDefeat;
  const showRetry = isDefeatSequence || snapshot.phase === 'game-over';
  const sequencePercent = Math.max(0, Math.min(100,
    (snapshot.defeatSecondsLeft /
      (isSpecialDefeat || isNinjaFootsmother || isRoxyHypno || isRoxySmother
        ? NINJA_FOOTSMOTHER_DURATION : 20)) * 100));

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
                  <div className="enemy-track" aria-label={`${snapshot.activeEnemies} inimigas ativas, ${snapshot.defeatedEnemies} derrotadas`}>
                    {Array.from({ length: 9 }, (_, index) => (
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
                        Cinco amazonas, três kunoichis e Roxy. Mova-se, lute e sobreviva ao cerco na selva.
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

            {isDefeatSequence && !isGroupDefeat && (
              <div className="sequence-hud defeat-hud" role="status"
                data-testid={isNinjaFootsmother ? 'status-ninja-footsmother'
                  : isRoxyHypno ? 'status-roxy-hypno'
                  : isRoxySmother ? 'status-roxy-smother'
                  : isSpecialDefeat ? 'status-special-defeat' : 'status-group-defeat'}>
                <div className="sequence-info">
                  <span className="sequence-label">
                    {isNinjaFootsmother ? 'Footsmother da kunoichi'
                      : isRoxyHypno ? 'Hipnose da Roxy'
                      : isRoxySmother ? 'Smother da Roxy'
                      : isSpecialDefeat ? 'Luta para se soltar' : 'Heroína desmaiada'}
                  </span>
                  <span className="sequence-hint">
                    {isNinjaFootsmother || isRoxyHypno || isRoxySmother
                      ? 'Imobilização · 10 segundos' : 'Sequência de derrota'}
                  </span>
                </div>
                <strong className="sequence-time">{Math.max(0, snapshot.defeatSecondsLeft).toFixed(1)}<small>s</small></strong>
                <div className="sequence-track" aria-hidden="true">
                  <div className="sequence-fill" style={{ width: `${sequencePercent}%` }} />
                </div>
              </div>
            )}

            {showRetry && (
              <button
                className="retry-corner"
                type="button"
                onClick={restartGame}
                aria-label="Tentar novamente"
                data-testid="button-retry-defeat"
              >
                <RotateCcw aria-hidden="true" /> <span>Tentar novamente</span>
              </button>
            )}

            {isPlaying && (
              <div className="phase-chip">
                {`${snapshot.activeEnemies} ${snapshot.activeEnemies === 1 ? 'oponente ativo' : 'oponentes ativos'} · ${snapshot.defeatedEnemies} derrotadas`}
              </div>
            )}

            {(isPlaying || isGrapple) && (
              <div className="touch-controls" role="group" aria-label="Controles touch">
                <div className="touch-dpad" role="group" aria-label="Mover">
                  <TouchButton code="KeyW" label="Mover para cima" glyph="▲" className="touch-up" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                  <TouchButton code="KeyA" label="Mover para a esquerda" glyph="◀" className="touch-left" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                  <TouchButton code="KeyD" label="Mover para a direita" glyph="▶" className="touch-right" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                  <TouchButton code="KeyS" label="Mover para baixo" glyph="▼" className="touch-down" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                </div>
                <div className="touch-action-pad" role="group" aria-label="Ações">
                  <TouchButton code="KeyJ" label="Soco ou escapar" glyph="J" caption="SOCO" className="touch-punch" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                  <TouchButton code="KeyK" label="Chute" glyph="K" caption="CHUTE" className="touch-kick" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                  <TouchButton code="Space" label="Pular" glyph="⤒" caption="PULAR" className="touch-jump" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                  <TouchButton code="ShiftLeft" label="Correr" glyph="»" caption="CORRER" className="touch-run" onPress={pressVirtualControl} onRelease={releaseVirtualControl} />
                </div>
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
            <div className="touch-control-note">No celular, use os botões sobre a arena.</div>
          </div>
        </section>
        <div className="footer-note"><Swords size={12} /> <span>5 Amazonas · 3 Kunoichis</span> · arena de combate 2.5D · feita para jogar</div>
      </div>
    </main>
  );
}

export default App;
