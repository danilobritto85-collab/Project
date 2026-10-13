import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import {
  AudioLines,
  VolumeX,
  Compass,
  Heart,
  Play,
  Plus,
  Minus,
  RotateCcw,
  Swords,
} from 'lucide-react';
import jungleBackground from '@assets/background_1791470375690.png';
import {
  DEFAULT_FIGHT_CONFIG,
  NINJA_FOOTSMOTHER_DURATION,
  STATE_NINJA_FOOTSMOTHER,
  STATE_ROXY_OFFER,
  STATE_ROXY_CHALLENGE,
  STATE_ROXY_SMOTHER,
  useJungleGame,
  type FightConfig,
} from './game/useJungleGame';

type OpponentCountKey = 'amazonas' | 'ebony' | 'ninjas' | 'roxy';

function formatScore(score: number) {
  return Math.max(0, score).toString().padStart(6, '0');
}

interface OpponentCounterProps {
  label: string;
  kind: OpponentCountKey;
  value: number;
  onChange: (kind: OpponentCountKey, value: number) => void;
}

function OpponentCounter({ label, kind, value, onChange }: OpponentCounterProps) {
  return (
    <div className="opponent-row">
      <div className="opponent-label">
        <span>{label}</span>
        <small>quantidade livre</small>
      </div>
      <div className="quantity-control" aria-label={`Quantidade de ${label}`}>
        <button type="button" onClick={() => onChange(kind, value - 1)}
          disabled={value <= 0} aria-label={`Diminuir ${label}`}>
          <Minus aria-hidden="true" />
        </button>
        <input type="number" min="0" step="1" inputMode="numeric"
          value={value} aria-label={`Quantidade de ${label}`}
          data-testid={`count-${kind}`}
          onChange={(event) => onChange(kind,
            event.currentTarget.value === '' ? 0 : event.currentTarget.valueAsNumber)} />
        <button type="button" onClick={() => onChange(kind, value + 1)}
          disabled={!Number.isSafeInteger(value + 1)} aria-label={`Aumentar ${label}`}>
          <Plus aria-hidden="true" />
        </button>
      </div>
    </div>
  );
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
      onDragStart={(event) => event.preventDefault()}
      onSelect={(event) => event.preventDefault()}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="touch-control-glyph">{glyph}</span>
      {caption && <span className="touch-control-caption">{caption}</span>}
    </button>
  );
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fightConfig, setFightConfig] = useState<FightConfig>(DEFAULT_FIGHT_CONFIG);
  const {
    snapshot,
    startGame,
    restartGame,
    retryGame,
    toggleSound,
    pressVirtualControl,
    releaseVirtualControl,
    chooseRoxyChallenge,
    exitRoxyChallenge,
    exitEbonyVictory,
  } = useJungleGame(canvasRef, fightConfig);
  const hpPercent = Math.max(0, Math.min(100, (snapshot.heroHp / snapshot.maxHeroHp) * 100));
  const escapePercent = Math.max(0, Math.min(100, snapshot.escapeProgress * 100));
  const isTitle = snapshot.phase === 'title';
  const isGrapple = snapshot.phase === 'grapple';
  const isSpecialDefeat = snapshot.phase === 'special-defeat';
  const isNinjaFootsmother = snapshot.phase === STATE_NINJA_FOOTSMOTHER;
  const isRoxyOffer = snapshot.phase === STATE_ROXY_OFFER;
  const isRoxyChallenge = snapshot.phase === STATE_ROXY_CHALLENGE;
  const isRoxySmother = snapshot.phase === STATE_ROXY_SMOTHER;
  const isGroupDefeat = snapshot.phase === 'group-defeat';
  const isPlaying = snapshot.phase === 'playing';
  const isDefeatSequence = isSpecialDefeat || isNinjaFootsmother || isRoxySmother || isGroupDefeat ||
    snapshot.phase === 'ebony-victory';
  const showRetry = isDefeatSequence || snapshot.phase === 'game-over';
  const fightCount = fightConfig.amazonas + fightConfig.ebony + fightConfig.ninjas + fightConfig.roxy;
  const handleOpponentCountChange = (kind: OpponentCountKey, value: number) => {
    if (!Number.isSafeInteger(value) || value < 0) return;
    setFightConfig((current) => ({
      ...current,
      [kind]: value,
    }));
  };
  const sequencePercent = Math.max(0, Math.min(100,
    (snapshot.defeatSecondsLeft /
      (isSpecialDefeat || isNinjaFootsmother || isRoxySmother
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
                    {Array.from({ length: snapshot.totalEnemies }, (_, index) => (
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
                      Monte o confronto e escolha quantas adversárias entram na arena.
                    </p>
                  </div>
                  <section className="title-setup" aria-labelledby="setup-title">
                    <div className="setup-kicker">Pré-jogo · Confronto</div>
                    <h2 id="setup-title">Escolha suas adversárias</h2>
                    <div className="opponent-list">
                      <OpponentCounter label="Amazonas" kind="amazonas"
                        value={fightConfig.amazonas}
                        onChange={handleOpponentCountChange} />
                      <OpponentCounter label="Amazon Ebony" kind="ebony"
                        value={fightConfig.ebony}
                        onChange={handleOpponentCountChange} />
                      <OpponentCounter label="Ninjas" kind="ninjas"
                        value={fightConfig.ninjas}
                        onChange={handleOpponentCountChange} />
                      <OpponentCounter label="Roxy" kind="roxy"
                        value={fightConfig.roxy}
                        onChange={handleOpponentCountChange} />
                    </div>
                    {fightConfig.ebony > 0 && (
                      <div className="ebony-options">
                        <label>
                          <input type="checkbox" checked={fightConfig.ebonyVictory}
                            data-testid="checkbox-ebony-victory"
                            onChange={(event) => setFightConfig((current) => ({
                              ...current, ebonyVictory: event.target.checked,
                            }))} />
                          Incluir cenas consentidas de vitória Ebony
                        </label>
                        <p>Stomp automático: com 42 HP ou menos, ataques próximos têm 25% de chance
                          de iniciar o combo. Ele termina e devolve a luta ao combate; as cenas
                          consentidas de vitória são separadas, opcionais e podem ser encerradas.</p>
                      </div>
                    )}
                    {fightConfig.roxy > 0 ? (
                      <p className="roxy-special-help">
                        <strong>Especial da Roxy:</strong> é automático, sem botão. Com 42 HP ou menos,
                        ataques próximos podem iniciar um agarrão (25% de chance). Pressione <kbd>J</kbd>
                        por 5 s para escapar; se a Roxy agarrar a heroína, falhar pode levar ao convite
                        voluntário ou ao Smother.
                      </p>
                    ) : fightCount > 0 ? (
                      <p className="roxy-special-help">Roxy não participa desta luta.</p>
                    ) : (
                      <p className="roxy-special-help">Selecione ao menos uma adversária para começar.</p>
                    )}
                    <button className="start-button" type="button"
                      onClick={() => startGame(fightConfig)}
                      disabled={fightCount === 0} data-testid="button-start">
                      <Play fill="currentColor" /> Iniciar luta · {fightCount}
                    </button>
                  </section>
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

            {isDefeatSequence && !isGroupDefeat && !snapshot.ebonyVictoryActive && (
              <div className="sequence-hud defeat-hud" role="status"
                data-testid={isNinjaFootsmother ? 'status-ninja-footsmother'
                  : isRoxySmother ? 'status-roxy-smother'
                  : isSpecialDefeat ? 'status-special-defeat' : 'status-group-defeat'}>
                <div className="sequence-info">
                  <span className="sequence-label">
                    {isNinjaFootsmother ? 'Footsmother da kunoichi'
                      : isRoxySmother ? 'Smother da Roxy'
                      : isSpecialDefeat ? 'Luta para se soltar' : 'Heroína desmaiada'}
                  </span>
                  <span className="sequence-hint">
                    {isNinjaFootsmother || isRoxySmother
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
                onClick={retryGame}
                aria-label="Tentar novamente"
                data-testid="button-retry-defeat"
              >
                <RotateCcw aria-hidden="true" /> <span>Tentar novamente</span>
              </button>
            )}
            {snapshot.ebonyVictoryActive && (
              <button className="end-ebony-scene" type="button"
                onClick={exitEbonyVictory} data-testid="button-end-ebony-scene">
                Encerrar cena
              </button>
            )}

            {isPlaying && (
              <div className="phase-chip">
                {`${snapshot.activeEnemies} ${snapshot.activeEnemies === 1 ? 'oponente ativo' : 'oponentes ativos'} · ${snapshot.defeatedEnemies} derrotadas`}
              </div>
            )}

          </div>

          {(isPlaying || isGrapple) && (
            <div className="touch-controls" role="group" aria-label="Controles de jogo">
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

          {isRoxyOffer && (
            <section className="roxy-choice-panel" role="dialog"
              aria-labelledby="roxy-choice-title" aria-describedby="roxy-choice-description"
              data-testid="roxy-consent-offer">
              <div className="roxy-choice-copy">
                <h2 id="roxy-choice-title">Desafio opcional da Roxy</h2>
                <p id="roxy-choice-description">
                  Interação voluntária entre personagens adultas: hipnose apenas após
                  aceitar, seguida do beijo nos pés. Sem perda de HP; você pode parar.
                </p>
                <p className="roxy-dialogue">Roxy: “Quer participar? Você pode recusar ou parar quando quiser.”</p>
              </div>
              <div className="roxy-choice-actions">
                <button type="button" className="roxy-choice-accept"
                  onClick={() => chooseRoxyChallenge(true)} data-testid="button-roxy-accept">
                  Aceitar hipnose e cena <kbd>Y</kbd>
                </button>
                <button type="button" onClick={() => chooseRoxyChallenge(false)}
                  data-testid="button-roxy-decline" autoFocus>
                  Recusar · derrota normal <kbd>N</kbd>
                </button>
              </div>
            </section>
          )}

          {isRoxyChallenge && (
            <section className="roxy-choice-panel roxy-voluntary-panel" aria-live="polite"
              data-testid="roxy-voluntary-scene">
              <div className="roxy-choice-copy">
                <h2>Hipnose consentida · HP preservado</h2>
                <p>Heroína: “Quero participar da hipnose. Posso parar a qualquer momento.”</p>
                {snapshot.roxyChallengeElapsed >= 3.6 && (
                  <p className="roxy-dialogue" data-testid="roxy-dialogue">
                    Roxy: “Beija meus pés… Isso… boa menina.”
                  </p>
                )}
              </div>
              <div className="roxy-choice-actions">
                <button type="button" onClick={exitRoxyChallenge}
                  data-testid="button-roxy-stop">
                  {snapshot.defeatSecondsLeft > 0 ? 'Parar a cena' : 'Voltar ao combate'} <kbd>Esc</kbd>
                </button>
              </div>
            </section>
          )}

          <div className="controls-strip">
            <div className="control-title">Comandos de combate</div>
            <div className="control-list">
              <div className="control-item"><kbd>WASD</kbd><span>/</span><kbd>↑↓←→</kbd> Mover</div>
              <div className="control-item"><kbd>Shift</kbd> Correr</div>
              <div className="control-item"><kbd>J</kbd> Soco / escapar</div>
              <div className="control-item"><kbd>K</kbd> Chute</div>
              <div className="control-item"><kbd>Espaço</kbd> Pular</div>
            </div>
            <div className="touch-control-note">No celular, os controles ficam abaixo da arena.</div>
          </div>
        </section>
        <div className="footer-note"><Swords size={12} /> <span>Quantidades livres · Muitos personagens podem reduzir o desempenho</span> · arena de combate 2.5D</div>
      </div>
    </main>
  );
}

export default App;
