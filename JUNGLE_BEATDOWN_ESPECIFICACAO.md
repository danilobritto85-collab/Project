# Jungle Beatdown — especificação para desenvolvimento

Este documento reúne o conceito, as regras de jogo e as decisões de produto para continuar **Jungle Beatdown** em outra plataforma. Ele foi escrito para ser independente do código atual; use-o como guia para reconstruir ou migrar o jogo.

## 1. Visão do jogo

- **Gênero:** beat ’em up arcade 2.5D para uma jogadora.
- **Ambientação:** ruínas e floresta amazônica.
- **Heroína:** exploradora loira controlada pela jogadora.
- **Objetivo:** enfrentar uma escalação configurável de lutadoras, sobreviver, vencer ondas e acompanhar cenas de derrota ou desafios especiais.
- **Apresentação atual:** arte pixelada em uma arena Canvas 1024×576, redimensionada responsivamente; HUD e menus HTML/React. A implementação pode usar outra engine, desde que preserve controles, regras, cenas e acessibilidade.
- **Idioma da interface:** português. Manter os nomes próprios de personagens e o rótulo de interface **Defeeated**.

## 2. Regras de precedência

1. As decisões mais recentes da pessoa responsável pelo jogo prevalecem sobre ideias antigas, exemplos de prompt e o protótipo original.
2. Não aplicar automaticamente propostas antigas como “sempre cinco Amazonas”, respawn obrigatório, fim de jogo após 20 segundos ou um golpe final forçado. O elenco deve ser configurado pela jogadora.
3. Quantidades de adversárias devem ser livremente configuráveis, sem limites artificiais por categoria. Avisar que elencos grandes podem reduzir o desempenho. O protótipo atual limita a Chefe de Quatro Braços a uma; alinhar essa exceção antes de mantê-la em uma migração.
4. Desafios ou cenas especiais interativas precisam de aceite explícito antes de começar, uma opção clara de recusa e uma opção de sair durante a cena.
5. Em cenas consensuais, todos os participantes devem ser adultos. Nunca apresentar interação especial como requisito para vencer.

## 3. Fluxo principal

1. **Menu pré-jogo:** escolher as quantidades de cada adversária. Começar fica desativado se nenhuma foi selecionada.
2. **Combate:** controlar a heroína contra a escalação. Exibir vida, pontuação e estado/resumo das adversárias.
3. **Derrota:** mostrar a sequência correspondente à oponente que causou a derrota. Derrotas genéricas não mostram contagem regressiva; a pose final pode permanecer na arena.
4. **Reiniciar:** interromper a cena/áudio ativos e voltar ao menu de escolha de adversárias, preservando as quantidades configuradas quando apropriado.
5. **Prévia Defeeated:** disponível como botão na tela de combate. Escolher uma adversária atualmente em campo abre uma prévia da derrota causada por ela, sem alterar vida, pontuação ou progresso. “Voltar à luta” restaura exatamente a luta suspensa.

## 4. Controles

| Ação | Teclado | Toque |
|---|---|---|
| Mover no plano da arena | WASD ou setas | Direcional virtual |
| Correr | Shift | Botão de corrida |
| Socar / escapar de agarrão | J | Botão J |
| Chutar | K | Botão K |
| Pular | Espaço | Botão de pulo |
| Aceitar/recusar convite | Y / N quando mostrado | Botões no diálogo |
| Sair de cena opcional | Esc ou botão visível | Botão visível |

### Requisitos para celular

- Controles grandes, fora da área principal de combate quando possível, com espaçamento e zonas de toque distintas.
- Botões com `pointerdown`/`pointerup` ou eventos de toque; impedir seleção de texto, arraste de imagem, clique fantasma e propagação para canvas/personagens.
- Suportar toque simultâneo (mover + atacar/correr), manter estados pressionados até soltar e limpar estados em `pointercancel`, perda de foco e troca de tela.
- Botão de áudio global, acessível e com indicação visual ligado/desligado. Não iniciar áudio antes do gesto inicial exigido pelo navegador.
- Respeitar `prefers-reduced-motion` para tremores e efeitos visuais não essenciais.

## 5. Arena e regras de combate

- Movimento 2.5D: X avança lateralmente e Y permite deslocamento de profundidade dentro da faixa de chão. Manter lutadoras e heroína dentro dos limites caminháveis; ordenar desenho pela coordenada Y para simular profundidade.
- O pulo é uma elevação visual/física curta, sem sair da área de jogo.
- Cada ataque tem animação, alcance, hitbox e janela de acerto próprios. Aplicar dano uma vez por janela/acerto, evitar múltiplas colisões no mesmo golpe e dar um intervalo curto de invulnerabilidade após receber dano.
- Recuo e queda devem acompanhar o impacto; o sprite não pode deslizar, flutuar, piscar, sumir, duplicar ou trocar de personagem no meio da animação.
- Oponentes em estados de ataque, dano, queda ou agarrão não devem ter a pose sobrescrita pela IA de caminhada antes de o temporizador terminar.
- Adversárias selecionadas entram no combate como inimigas controladas por IA. Não criar quantidade fixa de personagens ativas.
- As lutadoras são visualmente um pouco maiores que a heroína, sem hitboxes desproporcionais.
- O botão “Reiniciar” da interface volta à seleção pré-jogo; não deve recarregar direto uma partida com elenco fixo.

## 6. Elenco e comportamento esperado

| Personagem | Papel e requisitos |
|---|---|
| **Heroína / Exploradora** | Personagem jogável; idle, andar/correr, socar, chutar, pular, dano, queda e desmaio. Áudio de dano, esforço, respiração profunda durante cenas pertinentes e suspiro lento no desmaio. |
| **Amazonas** | Inimigas com guarda, aproximação e variedade de chutes (frontal, giratório e alto); voz/áudio de chute e risada quando configurado. Unhas dos pés vermelhas em todos os sprites e variantes. |
| **Amazon Ebony** | Variante selecionável separada das Amazonas comuns. Usar os ataques da própria folha; oferecer stomp e giro como especiais distintos. O stomp causa bastante dano e pode ocorrer durante a luta. A configuração atual prevê alternância dos especiais e chance configurável de KO em um acerto; manter explícita e ajustável, não escondida. Cenas de vitória especiais opcionais por configuração. |
| **Ninjas** | Ataques com variedade de chutes e voz de combate nos chutes. Cena personalizada de struggle/footsmother disponível, animada e com áudio; pose de término permanece estática após o tempo definido. |
| **Roxy** | Ataques e poses próprios, sem usar sprites de Amazon. Corrigir recortes/âncoras para ela não parecer presa ao chão nem piscar na vitória. Golpes com voz. Especial de hipnose usa a sequência completa de quadros. Convite opcional antes da interação; hipnose e finalização não reduzem HP; heroína pode recusar ou parar. Diálogo pedido: “Beija meus pés… Isso… boa menina.” |
| **Karateka loira** | Lutadora distinta, com seus próprios socos, chutes e sprites. Sequência de desafio/derrota exclusiva, iniciada com consentimento quando aplicável. Se a heroína perder durante a cena especial, manter a animação específica; nunca trocar para uma derrota genérica nem exibir sprites de Amazonas. |
| **Karateka Ebony** | Lutadora distinta, sprites e ataques próprios, incluindo a pose/folha `atk_1` quando as condições de duo forem satisfeitas. Taunt deve provocar/chamar a heroína; aproximação ativa uma oferta de agarrão, aceitar/recusar. Incluir giro pesado como golpe especial. A sequência de derrota tem quadros completos, sem cortes, duplicações ou Amazonas indevidas. |
| **Minerva** | Adversária de IA, não personagem jogável no estado atual do produto. Alta velocidade; guarda, caminhada/corrida, socos e chute alto; hitboxes acompanham os quadros. Sequências especiais opcionais. |
| **May** | Adversária de IA. Alterna combinações e chutes de longo alcance; pode bloquear ataques próximos e reposicionar. Sequência de derrota própria e consentida quando especial. |
| **Laura** | Adversária de IA com guarda, caminhada, socos e chutes. A sequência de derrota deve usar os quadros correspondentes da folha, sem sprite de outra personagem, preservando a animação em vez de cair para genérico. Dois quadros de chute da folha original estão sobrepostos a outras poses e exigem máscaras específicas ou arte isolada para ficarem limpos. |
| **Pantera** | Adversária de IA com os ataques e cenas de punição/combo próprios; a variedade pode combinar golpes de combate já existentes, mas deve usar os sprites da Pantera. |
| **Chefe de Quatro Braços** | Chefe de combate de grande porte: guarda, locomação, socos de quatro braços, chutes e stomp. Hitboxes/hurtboxes adequados à escala e às poses. Cena final especial é um desafio separado, com aceite, recusa e saída a qualquer momento. |

## 7. Especiais e desafios consentidos

- Uma animação de derrota de combate pode ser automática. Cenas especiais interativas não.
- Mostrar convite legível com duas escolhas inequívocas: **Aceitar** e **Recusar**. Não pré-selecionar aceite.
- Durante a cena, manter controle/saída visível e suporte a Esc. Sair retorna à luta ou ao estado definido na interface sem travar.
- **Roxy:** oferta antes da hipnose; sequência de quadros hipnóticos completa; fala só no trecho combinado; desafio voluntário preserva HP; opção de parar.
- **Karatekas:** agarrão/desafio com aceite explícito; recusa mantém a luta/derrota comum. Preservar a sequência de cada lutadora em caso de derrota.
- **Amazon Ebony:** opção de cenas especiais de vitória no menu; desligadas por padrão se a jogadora não as selecionar. Stomp e golpe de combate não devem ser confundidos com a cena final.
- **Chefe de Quatro Braços:** finalização especial opt-in, não automática; ao recusar, usar derrota de combate normal.
- Outros quadros de vitória/derrota pedidos pelo usuário também devem ser opcionais quando representam serviço, submissão ou interação íntima. Não misturar essas cenas com dano/HP da partida.

## 8. Derrotas e prévias

- **Derrota genérica:** heroína recebe o golpe, reage, cai e termina desmaiada. Oponentes permanecem visíveis e parados em pose neutra; sem animação de punição automática, contador ou janela “Game Over” que cubra o jogo.
- **Derrotas personalizadas:** Nina, Roxy, lutadoras de Karate, Minerva, May, Laura, Pantera, Amazonas Ebony e chefe usam a sequência própria quando existe. Fazer o fluxo de derrota manter a personagem que realmente causou o KO.
- As sequências podem ter duração/áudio próprios, mas o HUD não pode bloquear a arte. Usar contagem apenas nas cenas que precisam de tempo/escape; não mostrar contador para derrota genérica.
- **Defeeated:** listar adversárias elegíveis em campo; prévia é apenas visual e não aplica dano, recompensa, vitória, derrota, RNG ou gasto de recurso. Preservar snapshot completo da partida e restaurá-lo ao sair.
- Após a cena, manter a pose final onde especificado e deixar “Tentar novamente”/retorno ao menu fácil de alcançar.

## 9. Áudio

- Um único controle global de som silencia todos os efeitos e vozes.
- Categorias previstas: chutes das Amazonas; chutes das Ninjas; chutes da Roxy e das Karatekas; dano da heroína; struggle; risadas das inimigas; respiração profunda; suspiro ao desmaiar; som de beijo quando uma sequência que o exige está ativa; áudio mágico sutil da hipnose.
- Vozes de golpes devem tocar sincronizadas com o impacto e não em todos os frames de idle. Variar ou limitar repetição para não ficar mecânico.
- Durante fumaça de uma cena personalizada, usar respiração profunda da heroína conforme pedido. Na derrota, conduzir da respiração difícil ao suspiro lento final.
- Parar todos os áudios/loops ao sair, reiniciar, recusar ou terminar a cena. Não deixar sons de luta tocando em menus/prévias congeladas.
- Áudio deve respeitar gesto inicial do browser, volumes razoáveis, cooldowns e nenhum canal sobreposto causando clipping.

## 10. Arte e pipeline de sprites

- Inspecionar cada asset na resolução nativa antes de calcular células; não confiar na miniatura da conversa. Confirmar dimensões/formato (arquivos com extensão enganosa já ocorreram).
- Manter coordenadas no espaço nativo da folha e validar `x + w`/`y + h` contra as dimensões.
- Remover fundos de folhas individuais e quadros de storyboard com algoritmos distintos. Para sprites de um só personagem, usar máscara/contorno por pose; não apagar todos os tons escuros ou neutros (cabelo, pele, sombra e uniforme podem compartilhar cores com o fundo).
- Em cenas com duas personagens, preservar ambas. Processar cada painel/contorno separadamente; não usar uma extração de maior componente se ela apagar a segunda pessoa.
- Para checkerboards, preferir flood-fill pelas bordas de cada painel, seguido de limpeza local de ilhas. Evitar uma chave global de cinza, que perfura roupa e pele.
- Cortes devem manter a silhueta toda, pés no mesmo plano do chão e escala ancorada no corpo, não em fumaça, corações ou espaço vazio. Usar centro/pés coerentes entre poses.
- Quadros sobrepostos em uma imagem composta precisam de máscara poligonal específica. Se a arte cobrir parte do corpo que se quer animar, não inventar pixels nem reutilizar uma pose com membros duplicados: pedir/quebrar a arte em quadros separados ou ocultar somente essa variação até haver fonte adequada.
- Para cada personagem, validar em idle, caminhada, cada ataque, dano, queda, vitória, tamanhos de tela pequeno/grande e orientação de movimento. Confirmar visualmente os quadros no render, não só com typecheck.

## 11. Arquivos de arte/áudio já presentes no projeto de origem

Os nomes abaixo estão no diretório `attached_assets/` do projeto original e devem ser copiados, reimportados ou substituídos na migração. Não presuma que um novo ambiente terá esses arquivos automaticamente.

### Base

- `background_1791470375690.png`, `hero_1791470375690.png`, `amazon_1791470375689.png`
- `pin_attack_1791470375691.png`, `pin_extended_1791470375691.png`
- `ninja_1791475869252.png`, `ninja_footsmother.png`, `ninja_footsmother_ending.png`

### Roxy e Amazonas

- `roxy_clean.png`, `roxy_1791553456528.png`, `roxy_hypno_1791553456528.png`, `roxy_smother_1791553456529.png`
- `amazon_ebony_clean.png`, `amazon_ebony_duo_clean.png`, `amazon_ebony_stomp_clean.png`, `amazon_ebony_victory_clean.png`
- Folhas originais: `amazon_ebony_1791560944520.png`, `amazon_ebony_2_1791560944520.png`, `amazon_ebony_stomp_1791560944521.png`, `amazon_ebony_victory_1791560944521.png`

### Karate, chefe e novas lutadoras

- Karatekas: `karate_blonde_1791929279634.png`, `karate_blonde_atk_1_1791929279635.png`, `karate_blonde_atk_2_1791929279636.png`, `karate_ebony_1791929279637.png`, `karate_ebony_atk_1_1791929279637.png`, `karate_ebony_atk_2_1791929279638.png`
- Pantera: `image_1792014912583.png`
- Chefe: `image_1793063368917.png`, `image_1793063355742.png`
- Minerva: `image_1793065095807.png`, `image_1793065104800.png`
- May: `image_1793093978357.jpeg`, `image_1793094318134.jpeg`
- Laura: `image_1793977523679.png`, `image_1793977536004.png`, `image_1793977593869.png`, `image_1793978481211.png`

### Áudio atual

Encontrados em `attached_assets/generated_audio/`:

`amazon_kick.mp3`, `ninja_kick.mp3`, `ninja_kiai_vocal.mp3`, `heroine_hurt.mp3`, `heroine_struggle_soft.mp3`, `heroine_deep_breath.mp3`, `heroine_faint_sigh.mp3`, `enemy_laugh.mp3`, `roxy_kick.mp3`, `roxy_hypnosis.mp3`, `roxy_voluntary_dialogue.mp3`, `karate_ebony_kick.mp3`, `karate_blonde_kick.mp3`, `soft_kiss_sfx.mp3`.

Adicionar sons para Pantera, May, Minerva, Laura e chefe se não houver equivalentes adequados. Evitar anunciar diálogo/voz como “real” se o arquivo não tiver sido validado.

## 12. Estrutura técnica sugerida para a nova plataforma

Separar responsabilidades, independentemente de framework:

1. **Configuração/pré-jogo:** roster, quantidades, opções de cenas e preferências de áudio.
2. **Simulação determinística:** update por delta time; estados da heroína e inimigas; hitboxes; IA; timers; eventos de combate.
3. **Renderizador:** arena, sorting por profundidade, spritesheets, partículas, HUD e efeitos.
4. **Controlador de entrada:** teclado, gamepad opcional e toque; normalização para ações sem deixar o UI disparar ações de jogo.
5. **Gerenciador de áudio:** grupos de som, mute global, cooldown, parar/limpar em transições.
6. **Máquina de estados:** `menu → playing ↔ grapple/optional-offer/optional-scene → defeat/game-over/retry`; prévia Defeeated suspende e restaura a simulação.
7. **Dados por personagem:** atlas/quadros, tempos de animação, alcance, dano, cooldown, hitbox/hurtbox, áudio e transições de derrota. Evitar condicionais visuais espalhadas que permitam desenhar a personagem errada.

### Máquina de estados de referência

```text
MENU
  └─ iniciar com elenco válido → PLAYING
PLAYING
  ├─ agarrão normal → GRAPPLE_QTE → escape → PLAYING
  ├─ HP zero → DEFEAT_SEQUENCE → GAME_OVER/pose final
  ├─ convite especial → OFFER → aceitar → OPTIONAL_SCENE
  │                          └─ recusar → PLAYING/DEFEAT_SEQUENCE normal
  └─ Defeeated → PREVIEW (simulação pausada) → restaurar PLAYING
OPTIONAL_SCENE
  └─ concluir, parar ou Esc → PLAYING ou MENU conforme a origem
GAME_OVER
  └─ Reiniciar → MENU com seleção disponível
```

## 13. Critérios de aceite antes de publicar

- [ ] É possível montar uma luta com as quantidades escolhidas e começar sem adversárias fixas inseridas pelo jogo.
- [ ] Reiniciar retorna ao menu de escolha e não deixa áudio/estado antigo ativo.
- [ ] Teclado e toque executam os mesmos comandos; controles touch não acionam golpes por clique propagado.
- [ ] Dano, KO e especiais não aplicam hit repetido por frame nem excedem regras/configuração.
- [ ] Cada animação mantém proporção, escala, âncora do chão e personagem correta; nenhum sprite desaparece ou duplica.
- [ ] Uma cena opcional exige aceite, pode ser recusada e pode ser encerrada.
- [ ] Defeeated não altera o estado da partida e restaura a luta exatamente.
- [ ] Derrota genérica não tem contador; sequências que usam contador mostram instruções de fuga claramente.
- [ ] Mute silencia todo o áudio e limpar uma cena para todos os efeitos.
- [ ] Validar com vários tamanhos de viewport, celular, áudio ligado/desligado e cada personagem selecionada individualmente.
- [ ] Executar testes de regras, verificação de tipos/build e inspeção visual de quadros reais.
- [ ] Confirmar direitos/licença de arte e áudio antes de publicar ou transferir assets para distribuição.

## 14. Pontos que precisam de confirmação/atenção na migração

- O protótipo aceita contagens livres para a maioria do elenco, mas a interface atual limita o chefe de quatro braços a uma cópia. A exigência geral posterior foi “quantos personagens quiser”; decidir se chefes também serão duplicáveis e adaptar escala/colisão/IA.
- As duas poses de chute da Laura que se sobrepõem precisam de uma nova extração/máscara ou quadros separados. Não tratá-las como prontas só porque estão dentro da folha.
- O storyboard da Laura tem diversos painéis; mapear cada painel pretendido para derrota, vitória e cena especial, mantendo os elementos opcionais sob consentimento. Os arquivos e painéis que não foram integrados por causa do conteúdo estão identificados na seção seguinte.
- A folha `karate_ebony_atk_1` foi especificada para uso em confrontos com duas Karatekas; confirmar esse pré-requisito ao implementar.
- Testar a cena do stomp da Amazon Ebony sem depender de um encerramento; o stomp é também um ataque de combate.
- Todos os nomes de personagem, valores de chance/dano, duração de cenas e comportamento de vitória devem ser configuráveis centralmente, não duplicados entre UI, IA e renderizador.

## 15. Artes da Laura — cenas especiais (opt-in)

As folhas abaixo estão em `attached_assets/` e **passaram a alimentar a sequência especial consentida da Laura**. A derrota de combate (sprites individuais) continua automática se a jogadora recusar o convite.

| Arquivo original (1024 × 765) | Uso atual |
|---|---|
| `image_1793977536004.png` | Folha “Enemy’s Victory” (painéis 7–10): fonte principal da sequência especial (golpe final, vitória, submissão, Ultimate Humiliation). |
| `image_1793977593869.png` | Continuação (painéis 11–13): Adoration & Contact, Foreground Kiss, Ultimate Reverence & Kiss. |
| `image_1793978481211.png` | Mesmo layout 7–10; mantida preparada como folha auxiliar / fallback da sequência. |

**Fluxo:** KO pela Laura → oferta Aceitar/Recusar → Aceitar percorre os 7 painéis (14 s) com respiração/beijo nos trechos finais e Esc para sair; Recusar mantém só a derrota de combate. Defeeated preserva o mesmo gate de consentimento.

