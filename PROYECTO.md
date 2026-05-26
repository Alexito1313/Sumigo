# Proyecto: App web para estudiar japonés

## Contexto

Esta es la especificación completa de una app web para estudiar japonés (kanji + vocabulario del Minna no Nihongo, lecciones 26-36, nivel J3 del curso de la usuaria).

El proyecto se inició en una conversación previa con Claude. Esta documentación contiene **todo el contexto, todos los datos y todas las decisiones de diseño** para poder retomar el desarrollo en Claude Code sin perder nada.

## Objetivo

Crear una web personal de estudio que:
- Se despliegue en GitHub Pages (gratis, sin backend)
- Funcione bien en móvil y escritorio
- Guarde el progreso en localStorage con opción de exportar/importar
- Crezca con el tiempo (la usuaria irá añadiendo más lecciones)

## Stack técnico

- **HTML + CSS + JavaScript vanilla** (sin frameworks, sin build)
- **Datos en archivos JSON** separados por bloque/lección
- **Progreso en localStorage** + exportar/importar a archivo JSON
- **Despliegue en GitHub Pages**

## Estructura de carpetas

```
japones-app/
├── index.html              ← entry point
├── css/
│   └── style.css
├── js/
│   ├── app.js              ← lógica principal
│   ├── data.js             ← carga los JSON
│   └── progress.js         ← gestión de progreso (localStorage + export/import)
└── data/
    ├── kanji/
    │   ├── D1.json
    │   ├── D2.json
    │   ├── ...
    │   └── D10.json
    └── vocab/
        ├── L26.json
        ├── L27.json
        ├── ...
        └── L36.json
```

## Formato de los datos

Cada palabra/kanji en JSON tiene esta estructura:

```json
{
  "jp": "住",
  "read": "ジュウ／す（む）",
  "mean": "vivir, residir, habitar",
  "type": "kanji",
  "extra": "住所(じゅうしょ)・住民(じゅうみん)"
}
```

**Campos:**
- `jp` (string): la palabra o kanji en japonés
- `read` (string): lectura en kana (para kanji incluye kun/on separadas por "／")
- `mean` (string): significado en español
- `type` (string): uno de:
  - `"kanji"`
  - `"verbo"`
  - `"sustantivo"`
  - `"adjetivo-i"`
  - `"adjetivo-na"`
  - `"adverbio"`
  - `"expresion"` (conjunciones, frases hechas, demostrativos, sufijos, etc.)
- `extra` (string, opcional): ejemplos de uso o información adicional

**Cada archivo JSON contiene un array** de estos objetos:

```json
[
  { "jp": "...", "read": "...", "mean": "...", "type": "...", "extra": "..." },
  { "jp": "...", "read": "...", "mean": "...", "type": "..." }
]
```

## Funcionalidades

### Pantalla principal (Home)

1. **Selector de contenido:** Kanji / Vocabulario / Ambos
2. **Selector de bloque/lección:** "Todo" o uno específico (D1-D10, L26-L36)
3. **Selector de modo:** Flashcards / Test / Repaso
4. **Resumen de progreso:** número de tarjetas falladas pendientes de repasar

### Modo Flashcards

- Ver tarjeta con el japonés (kanji o palabra)
- Tocar para voltear y ver lectura + significado + ejemplos
- Botones "Lo sabía" / "Lo fallé"
- Las falladas se guardan con peso +1 en localStorage
- Las acertadas reducen el peso en -1 (mínimo 0)
- Al final: resumen de aciertos/fallos + lista de fallos para repasar

### Modo Test (opción múltiple)

- Ver el japonés con su lectura
- **4 opciones de significado, TODAS DEL MISMO TIPO GRAMATICAL** que la respuesta correcta
  - Si la palabra es un verbo, las 4 opciones son verbos
  - Si es un sustantivo, las 4 son sustantivos
  - Esto vale tanto para kanji como para vocabulario
  - Si en el set actual no hay suficientes del mismo tipo, completar con tarjetas del global
- Al responder: la correcta se pinta **verde**, las incorrectas pintadas **rojo** (incluida la que el usuario eligió si era incorrecta)
- Botón "Siguiente" para avanzar
- Mismo sistema de peso de fallos que Flashcards

### Modo Repaso

- Saca solo las tarjetas que el usuario ha fallado más veces (peso > 0 en localStorage)
- Ordenadas por más falladas primero
- No requiere elegir bloque
- Puede ejecutarse en formato Flashcards o Test (preguntar al entrar)

### Pantalla de fin de sesión

- Aciertos / total + porcentaje
- Lista de tarjetas falladas en la sesión
- Botones: "Volver al inicio" / "Reintentar"

### Estadísticas (futuro, no bloqueante)

- Total estudiado, % global de aciertos
- Top 10 tarjetas más falladas
- Gráfico de progreso por bloque (opcional)

### Exportar / Importar progreso

- Botón "Exportar" → descarga un archivo `progreso-japones-YYYY-MM-DD.json` con el contenido completo de localStorage
- Botón "Importar" → permite subir un archivo JSON y sobrescribe el progreso actual (con confirmación)
- Esto resuelve el problema de cambiar de dispositivo

## Diseño visual

**Estilo:** Color y estilo japonés, pero limpio (no kitsch).

**Paleta sugerida:**
- Rojo bermellón (朱色 `shu-iro`) `#c5302a` para acentos
- Negro tinta `#1a1a1a` o `#222` para texto principal
- Fondo papel washi `#faf6ef` (modo claro) / `#1e1a16` (modo oscuro)
- Verde aciertos `#3a8a4e`
- Rojo errores `#c0392b` (más apagado que el bermellón)

**Tipografía:**
- Sans-serif para UI (system-ui, -apple-system, sans-serif)
- Para los caracteres japoneses, usar la fuente del sistema o "Noto Sans JP" si se carga desde Google Fonts
- Permitir tamaño grande para los kanji (40-60px en las tarjetas)

**Detalles:**
- Modo oscuro automático según preferencia del sistema (`prefers-color-scheme`)
- Bordes redondeados suaves (8-12px)
- Animaciones discretas al voltear tarjetas
- Sin emoji decorativos; iconos minimalistas si se necesitan

**Responsive:**
- Móvil first
- Botones grandes (mínimo 44px de altura para targets táctiles)
- En el test, las 4 opciones en columna en móvil, en 2x2 en escritorio

## Datos: contenido completo

A continuación están **todos los datos** que la app debe contener inicialmente. La usuaria los ha revisado y son sus apuntes oficiales del curso.

### Notas sobre las palabras de vocabulario

- Las palabras se muestran tal como las tiene la usuaria en sus apuntes (a veces mezcla kanji + hiragana cuando no ha estudiado aún ese kanji).
- En los ejemplos de kanji con paréntesis tipo `住所(じゅうしょ)`, el formato es para mostrar la lectura.

### Notas sobre los kanji

- La usuaria ya sabe estos kanji previos (J2, 104 kanji): 一二三四五六七八九十百千万円山川月火水木金土日年力田夕天空雨東西南北大中小上下右左白花私人口目耳手足男女子生名本何学会社先行来自毎時分半国書友今週休午前後校見聞読食飲買母父多少新古高安早長家門間入出外元気魚犬牛立言語話電車駅店道
- Y los del J3 (los que estamos estudiando ahora) D1-D10 = los 100 que están en este archivo.

---

## CONTENIDO DE LOS KANJI (J3, 100 kanji, D1-D10)

### D1 — Lugares y divisiones administrativas

```json
[
  {
    "jp": "住",
    "read": "ジュウ／す（む）",
    "mean": "vivir, residir, habitar",
    "type": "kanji",
    "extra": "中国に住みます(ちゅうごくにすみます) — vivir en China · 住民(じゅうみん) — habitante · 住所(じゅうしょ) — dirección"
  },
  {
    "jp": "所",
    "read": "ショ／ジョ／ところ／どころ",
    "mean": "lugar, sitio",
    "type": "kanji",
    "extra": "住所(じゅうしょ) — dirección · ば所(ばしょ) — lugar · 台所(だいどころ) — cocina · 元の所(もとのところ) — lugar de origen · 近所(きんじょ) — vecindario"
  },
  {
    "jp": "京",
    "read": "キョウ／ケイ",
    "mean": "capital (antigua)",
    "type": "kanji",
    "extra": "京と(きょうと) — Kioto · 東京(とうきょう) — Tokio · 上京(じょうきょう) — ir a la capital"
  },
  {
    "jp": "都",
    "read": "ト／ツ／みやこ",
    "mean": "capital, metrópolis",
    "type": "kanji",
    "extra": "京都(きょうと) — Kioto · 東京都(とうきょうと) — Metrópolis de Tokio · 都合がわるい(つごうがわるい) — no me viene bien · 都市(とし) — ciudad grande"
  },
  {
    "jp": "府",
    "read": "フ",
    "mean": "autonomía, comunidad autónoma, administración",
    "type": "kanji",
    "extra": "京都府(きょうとふ) — Prefectura de Kioto · 大さか府(おおさかふ) — Prefectura de Osaka · せい府(せいふ) — gobierno"
  },
  {
    "jp": "県",
    "read": "ケン",
    "mean": "prefectura (43 en Japón)",
    "type": "kanji",
    "extra": "千ば県(ちばけん) — Prefectura de Chiba · 県立(けんりつ) — prefectural"
  },
  {
    "jp": "市",
    "read": "シ／いち",
    "mean": "ciudad, mercado",
    "type": "kanji",
    "extra": "市ば(いちば) — mercado · 市やく所(しやくしょ) — ayuntamiento · 市長(しちょう) — alcalde"
  },
  {
    "jp": "区",
    "read": "ク",
    "mean": "barrio, distrito",
    "type": "kanji",
    "extra": "北区(きたく) — barrio norte · 地区(ちく) — zona, distrito"
  },
  {
    "jp": "町",
    "read": "チョウ／まち",
    "mean": "pueblo, ciudad pequeña",
    "type": "kanji",
    "extra": "町長(ちょうちょう) — alcalde del pueblo · 下町(したまち) — barrio popular"
  },
  {
    "jp": "村",
    "read": "ソン／むら",
    "mean": "villa, aldea",
    "type": "kanji",
    "extra": "村長(そんちょう) — presidente de la villa · 漁村(ぎょそん) — aldea de pescadores"
  }
]
```

### D2 — Adjetivos opuestos

```json
[
  {
    "jp": "明",
    "read": "メイ／あか（るい）",
    "mean": "luminoso, claro",
    "type": "kanji",
    "extra": "明るい人(あかるいひと) — persona alegre · せつ明(せつめい) — explicar · 明日(あした) — mañana"
  },
  {
    "jp": "暗",
    "read": "アン／くら（い）",
    "mean": "oscuro",
    "type": "kanji",
    "extra": "暗い人(くらいひと) — persona triste · 暗しょうばんごう(あんしょうばんごう) — PIN · 暗さつ(あんさつ) — asesinato"
  },
  {
    "jp": "遠",
    "read": "エン／とお（い）",
    "mean": "lejos",
    "type": "kanji",
    "extra": "遠い町(とおいまち) — pueblo lejano · 遠足(えんそく) — excursión"
  },
  {
    "jp": "近",
    "read": "キン／ちか（い）",
    "mean": "cerca",
    "type": "kanji",
    "extra": "近い町(ちかいまち) — pueblo cercano · 近所(きんじょ) — vecino · さい近(さいきん) — últimamente"
  },
  {
    "jp": "強",
    "read": "キョウ／つよ（い）",
    "mean": "fuerte",
    "type": "kanji",
    "extra": "強い人(つよいひと) — persona fuerte · 強ふう(きょうふう) — viento fuerte · べん強します(べんきょうします) — estudiar"
  },
  {
    "jp": "弱",
    "read": "ジャク／よわ（い）",
    "mean": "débil",
    "type": "kanji",
    "extra": "弱い人(よわいひと) — persona débil · 弱てん(じゃくてん) — punto débil · 弱にく強食(じゃくにくきょうしょく) — el fuerte se come al débil"
  },
  {
    "jp": "重",
    "read": "ジュウ／おも（い）",
    "mean": "pesado, importante",
    "type": "kanji",
    "extra": "重い(おもい) — pesado · じゅう大(じゅうだい) — importante · たい重(たいじゅう) — peso corporal · 重大(じゅうだい) — grave"
  },
  {
    "jp": "軽",
    "read": "ケイ／かる（い）",
    "mean": "ligero",
    "type": "kanji",
    "extra": "軽い(かるい) — ligero · 軽じどう車(けいじどうしゃ) — coche pequeño · 軽しょく(けいしょく) — comida ligera"
  },
  {
    "jp": "太",
    "read": "タイ／ふと（い）",
    "mean": "gordo, grueso",
    "type": "kanji",
    "extra": "太い(ふとい) — gordo · 太よう(たいよう) — sol · 太ります(ふとります) — engordar"
  },
  {
    "jp": "細",
    "read": "サイ／ほそ（い）／こま（かい）",
    "mean": "fino, delgado, detallado",
    "type": "kanji",
    "extra": "細い(ほそい) — fino · 細かい人(こまかいひと) — persona detallista · しょう細(しょうさい) — detalle"
  }
]
```

### D3 — Cualidades y acciones

```json
[
  {
    "jp": "特",
    "read": "トク／トッ",
    "mean": "especial",
    "type": "kanji",
    "extra": "特べつ(とくべつ) — especial · 特に(とくに) — especialmente · 特上(とくじょう) — buena calidad"
  },
  {
    "jp": "別",
    "read": "ベツ／わか（れる）",
    "mean": "separar",
    "type": "kanji",
    "extra": "別れます(わかれます) — separarse · 特別(とくべつ) — especial · 別々に(べつべつに) — por separado"
  },
  {
    "jp": "有",
    "read": "ユウ／あ（る）",
    "mean": "tener, haber",
    "type": "kanji",
    "extra": "有名(ゆうめい) — famoso · 有りょう(ゆうりょう) — de pago"
  },
  {
    "jp": "便",
    "read": "ビン／ベン／たよ（り）",
    "mean": "conveniencia, servicio postal",
    "type": "kanji",
    "extra": "便り(たより) — notificación · ふな便(ふなびん) — envío por barco · ゆう便きょく(ゆうびんきょく) — oficina de correos · 便めい(びんめい) — número de vuelo"
  },
  {
    "jp": "利",
    "read": "リ",
    "mean": "beneficioso, ventaja",
    "type": "kanji",
    "extra": "便利(べんり) — útil · 利子(りし) — interés · 有利(ゆうり) — ventajoso · 利ようする(りようする) — utilizar"
  },
  {
    "jp": "不",
    "read": "フ／ブ",
    "mean": "prefijo negativo",
    "type": "kanji",
    "extra": "不便(ふべん) — inconveniente · 不足します(ふそくします) — faltar · 不安(ふあん) — inseguro"
  },
  {
    "jp": "切",
    "read": "セツ／き（る）／きっ",
    "mean": "cortar",
    "type": "kanji",
    "extra": "切ます(きります) — cortar · 切手(きって) — sello · 大切(たいせつ) — importante · しん切(しんせつ) — amable"
  },
  {
    "jp": "元",
    "read": "ゲン／ガン／もと",
    "mean": "origen",
    "type": "kanji",
    "extra": "元のばしょ(もとのばしょ) — sitio donde estaba · 元気(げんき) — bien · 元日(がんじつ) — Año Nuevo · 元かれ(もとかれ) — ex novio"
  },
  {
    "jp": "好",
    "read": "コウ／す（き）",
    "mean": "gustar",
    "type": "kanji",
    "extra": "好きです(すきです) — gustar · 好ぶつ(こうぶつ) — comida favorita"
  },
  {
    "jp": "急",
    "read": "キュウ／いそ（ぐ）",
    "mean": "darse prisa",
    "type": "kanji",
    "extra": "急ぎます(いそぎます) — darse prisa · 急に(きゅうに) — de repente · 特急(とっきゅう) — expreso"
  }
]
```

### D4 — Cualidades y colores

```json
[
  {
    "jp": "低",
    "read": "テイ／ひく（い）",
    "mean": "bajo",
    "type": "kanji",
    "extra": "せが低い(せがひくい) — bajo de estatura · さい低(さいてい) — lo peor · さい低気おん(さいていきおん) — temperatura mínima"
  },
  {
    "jp": "広",
    "read": "コウ／ひろ（い）",
    "mean": "amplio",
    "type": "kanji",
    "extra": "広い家(ひろいえ) — casa amplia · 広こく(こうこく) — publicidad · 広ば(ひろば) — plaza"
  },
  {
    "jp": "短",
    "read": "タン／みじか（い）",
    "mean": "corto",
    "type": "kanji",
    "extra": "短いかみ(みじかいかみ) — pelo corto · 短気(たんき) — sin paciencia · 短時間(たんじかん) — poco tiempo"
  },
  {
    "jp": "良",
    "read": "リョウ／よ（い）",
    "mean": "bien, bueno",
    "type": "kanji",
    "extra": "良心(りょうしん) — buen corazón · 不良(ふりょう) — chicos malos"
  },
  {
    "jp": "悪",
    "read": "アク／わる（い）",
    "mean": "mal, malo",
    "type": "kanji",
    "extra": "つごうが悪い(つごうがわるい) — me viene mal · 悪魔(あくま) — demonio · 悪人(あくにん) — persona mala · さい悪(さいあく) — terrible"
  },
  {
    "jp": "正",
    "read": "セイ／ショウ／ただ（しい）",
    "mean": "correcto",
    "type": "kanji",
    "extra": "お正月(おしょうがつ) — Año Nuevo · 正もん(せいもん) — puerta principal · 正じき(しょうじき) — honesto"
  },
  {
    "jp": "変",
    "read": "ヘン／か（わる）／か（える）",
    "mean": "cambiar, extraño",
    "type": "kanji",
    "extra": "変なひと(へんなひと) — persona rara · 大変(たいへん) — duro, difícil · 変たい(へんたい) — pervertido"
  },
  {
    "jp": "赤",
    "read": "セキ／あか（い）",
    "mean": "rojo",
    "type": "kanji",
    "extra": "赤ちゃん(あかちゃん) — bebé · 赤字(あかじ) — déficit · 赤道(せきどう) — Ecuador"
  },
  {
    "jp": "青",
    "read": "セイ／あお（い）",
    "mean": "azul",
    "type": "kanji",
    "extra": "青春(せいしゅん) — juventud · 青年(せいねん) — chico joven"
  },
  {
    "jp": "黒",
    "read": "コク／くろ（い）",
    "mean": "negro",
    "type": "kanji",
    "extra": "黒ばん(こくばん) — pizarra · 黒人(こくじん) — persona negra"
  }
]
```

### D5 — Arte, ocio y mundo

```json
[
  {
    "jp": "映",
    "read": "エイ／うつ（す）",
    "mean": "proyectar, reflejar",
    "type": "kanji",
    "extra": "テレビに映します(テレビにうつします) — proyectar a la tele · 上映します(じょうえいします) — echar película"
  },
  {
    "jp": "画",
    "read": "ガ／カク",
    "mean": "pintura, dibujos",
    "type": "kanji",
    "extra": "映画(えいが) — película · 画家(がか) — pintor · まん画(まんが) — manga · けい画(けいかく) — planificar"
  },
  {
    "jp": "音",
    "read": "オン／おと",
    "mean": "sonido",
    "type": "kanji",
    "extra": "へんな音(へんなおと) — sonido extraño · 音よみ(おんよみ) — lectura on · はつ音(はつおん) — pronunciación"
  },
  {
    "jp": "楽",
    "read": "ガク／ラク／たの（しい）",
    "mean": "alegre, fácil, música",
    "type": "kanji",
    "extra": "日本語は楽しいです(にほんごはたのしいです) — el japonés es divertido · 音楽(おんがく) — música · 楽き(がっき) — instrumento · 楽な(らくな) — cómodo"
  },
  {
    "jp": "歌",
    "read": "カ／うた／うた（う）",
    "mean": "canción, cantar",
    "type": "kanji",
    "extra": "歌を歌います(うたをうたいます) — cantar canción · 歌手(かしゅ) — cantante · 歌し(かし) — letra · 国歌(こっか) — himno"
  },
  {
    "jp": "写",
    "read": "シャ／うつ（す）",
    "mean": "copiar",
    "type": "kanji",
    "extra": "ノートを写します(ノートをうつします) — copiar cuaderno · 写真(しゃしん) — fotografía"
  },
  {
    "jp": "真",
    "read": "シン／ま／まっ",
    "mean": "sincero, verdadero",
    "type": "kanji",
    "extra": "真ん中(まんなか) — centro · 真っ白(まっしろ) — totalmente blanco · 写真(しゃしん) — fotografía · 真じめ(まじめ) — serio"
  },
  {
    "jp": "旅",
    "read": "リョ／たび",
    "mean": "viaje",
    "type": "kanji",
    "extra": "一人旅(ひとりたび) — viajar solo · 旅かん(りょかん) — alojamiento tradicional · 旅行(りょこう) — viaje"
  },
  {
    "jp": "世",
    "read": "セ／セイ／よ",
    "mean": "mundo",
    "type": "kanji",
    "extra": "21世き(にじゅういっせいき) — siglo 21 · 世の中(よのなか) — sociedad · あの世(あのよ) — más allá · 世話をします(せわをします) — cuidar"
  },
  {
    "jp": "界",
    "read": "カイ",
    "mean": "límite, frontera",
    "type": "kanji",
    "extra": "世界(せかい) — mundo · げん界(げんかい) — límite personal"
  }
]
```

### D6 — Trabajo y profesiones

```json
[
  {
    "jp": "仕",
    "read": "シ／つか（える）",
    "mean": "servicio, servir",
    "type": "kanji",
    "extra": "仕方がない(しかたがない) — no hay nada que hacer · 仕事(しごと) — trabajo"
  },
  {
    "jp": "事",
    "read": "ジ／こと",
    "mean": "asunto, cosa",
    "type": "kanji",
    "extra": "仕事(しごと) — trabajo · 事む所(じむしょ) — oficina · か事(かじ) — incendio · 大切なこと(たいせつなこと) — cosas importantes"
  },
  {
    "jp": "銀",
    "read": "ギン",
    "mean": "plata",
    "type": "kanji",
    "extra": "銀行(ぎんこう) — banco · 銀メダル(ぎんメダル) — medalla de plata"
  },
  {
    "jp": "員",
    "read": "イン",
    "mean": "empleado, miembro",
    "type": "kanji",
    "extra": "会社員(かいしゃいん) — empleado · 店員(てんいん) — dependiente · 銀行員(ぎんこういん) — banquero"
  },
  {
    "jp": "医",
    "read": "イ",
    "mean": "medicina, médico",
    "type": "kanji",
    "extra": "医学(いがく) — estudios de medicina · 医者(いしゃ) — médico"
  },
  {
    "jp": "者",
    "read": "シャ／もの",
    "mean": "persona",
    "type": "kanji",
    "extra": "医者(いしゃ) — médico · 読者(どくしゃ) — lector"
  },
  {
    "jp": "働",
    "read": "ドウ／はたら（く）",
    "mean": "trabajar",
    "type": "kanji",
    "extra": "働きます(はたらきます) — trabajar · ろう働時間(ろうどうじかん) — hora de trabajo"
  },
  {
    "jp": "屋",
    "read": "オク／や",
    "mean": "tienda",
    "type": "kanji",
    "extra": "本屋(ほんや) — librería · 花屋(はなや) — florería · 魚屋(さかなや) — pescadería · 屋上(おくじょう) — azotea"
  },
  {
    "jp": "産",
    "read": "サン／う（む）",
    "mean": "nacimiento, producir",
    "type": "kanji",
    "extra": "子どもが産まれます(こどもがうまれます) — nacimiento de niño · 中国産(ちゅうごくさん) — hecho en China · お土産(おみやげ) — souvenir"
  },
  {
    "jp": "業",
    "read": "ギョウ",
    "mean": "negocio, industria",
    "type": "kanji",
    "extra": "産業(さんぎょう) — industria · じゅ業(じゅぎょう) — clase · ざん業(ざんぎょう) — trabajar horas extra"
  }
]
```

### D7 — Naturaleza y elementos

```json
[
  {
    "jp": "林",
    "read": "リン／はやし",
    "mean": "grupo de árboles",
    "type": "kanji",
    "extra": "小林(こばやし) — Kobayashi · 林業(りんぎょう) — industria maderera"
  },
  {
    "jp": "森",
    "read": "シン／もり",
    "mean": "bosque",
    "type": "kanji",
    "extra": "どうぶつの森(どうぶつのもり) — Animal Crossing · 森林(しんりん) — forestal"
  },
  {
    "jp": "地",
    "read": "ジ／チ",
    "mean": "tierra",
    "type": "kanji",
    "extra": "地しん(じしん) — terremoto · 地ず(ちず) — mapa · 土地(とち) — terreno · 地下てつ(ちかてつ) — metro · 地きゅう(ちきゅう) — Tierra"
  },
  {
    "jp": "池",
    "read": "チ／いけ",
    "mean": "estanque",
    "type": "kanji",
    "extra": "池田さん(いけださん) — Ikeda · 電池(でんち) — pila"
  },
  {
    "jp": "海",
    "read": "カイ／うみ",
    "mean": "mar",
    "type": "kanji",
    "extra": "北海道(ほっかいどう) — Hokkaido · 海外旅行(かいがいりょこう) — viaje al extranjero"
  },
  {
    "jp": "洋",
    "read": "ヨウ",
    "mean": "océano, occidental",
    "type": "kanji",
    "extra": "大西洋(たいせいよう) — Atlántico · 洋ふく(ようふく) — ropa · 洋画(ようが) — película occidental · 洋食(ようしょく) — comida europea"
  },
  {
    "jp": "雪",
    "read": "セツ／ゆき",
    "mean": "nieve",
    "type": "kanji",
    "extra": "雪だるま(ゆきだるま) — muñeco de nieve · 大雪です(おおゆきです) — nieva mucho · 新雪(しんせつ) — nieve nueva"
  },
  {
    "jp": "光",
    "read": "コウ／ひかり／ひか（る）",
    "mean": "luz",
    "type": "kanji",
    "extra": "光ます(ひかります) — iluminar · 日光(にっこう) — luz del sol · かん光(かんこう) — turismo"
  },
  {
    "jp": "台",
    "read": "ダイ／タイ",
    "mean": "contador (vehículos)",
    "type": "kanji",
    "extra": "台わん(たいわん) — Taiwán · 1台、2台(いちだい、にだい) — 1, 2 · 台所(だいどころ) — cocina"
  },
  {
    "jp": "風",
    "read": "フウ／かぜ",
    "mean": "viento",
    "type": "kanji",
    "extra": "風が強い(かぜがつよい) — viento fuerte · 台風(たいふう) — tifón"
  }
]
```

### D8 — Estaciones y clima

```json
[
  {
    "jp": "季",
    "read": "キ",
    "mean": "estación (del año)",
    "type": "kanji",
    "extra": "四季(しき) — las cuatro estaciones · 季節(きせつ) — estación"
  },
  {
    "jp": "節",
    "read": "セツ／ふし",
    "mean": "época, sección",
    "type": "kanji",
    "extra": "かつお節(かつおぶし) — katsuobushi · 季節(きせつ) — estación del año"
  },
  {
    "jp": "春",
    "read": "シュン／はる",
    "mean": "primavera",
    "type": "kanji",
    "extra": "春休み(はるやすみ) — vacaciones de primavera · 青春(せいしゅん) — juventud"
  },
  {
    "jp": "夏",
    "read": "カ／なつ",
    "mean": "verano",
    "type": "kanji",
    "extra": "夏休み(なつやすみ) — vacaciones de verano · 夏ふく(なつふく) — ropa de verano"
  },
  {
    "jp": "秋",
    "read": "シュウ／あき",
    "mean": "otoño",
    "type": "kanji",
    "extra": "秋田県(あきたけん) — Akita · 秋分の日(しゅうぶんのひ) — equinoccio de otoño"
  },
  {
    "jp": "冬",
    "read": "トウ／ふゆ",
    "mean": "invierno",
    "type": "kanji",
    "extra": "冬休み(ふゆやすみ) — vacaciones de invierno · 冬ふく(ふゆふく) — ropa de invierno · 冬みん(とうみん) — hibernar · 春夏秋冬(しゅんかしゅうとう) — las 4 estaciones"
  },
  {
    "jp": "暑",
    "read": "ショ／あつ（い）",
    "mean": "caluroso",
    "type": "kanji",
    "extra": "夏暑い(なつあつい) — verano caluroso · もう暑い(もうあつい) — hace calor ya"
  },
  {
    "jp": "寒",
    "read": "カン／さむ（い）",
    "mean": "frío",
    "type": "kanji",
    "extra": "冬は寒い(ふゆはさむい) — el invierno es frío · ごう寒(ごうかん) — frío severo"
  },
  {
    "jp": "暖",
    "read": "ダン／あたた（かい）",
    "mean": "cálido",
    "type": "kanji",
    "extra": "暖かくなりました(あたたかくなりました) — se ha vuelto cálido · 暖ぼう(だんぼう) — calefacción"
  },
  {
    "jp": "涼",
    "read": "リョウ／すず（しい）",
    "mean": "fresco",
    "type": "kanji",
    "extra": "涼しい風(すずしいかぜ) — viento fresco · せい涼飲りょう水(せいりょういんりょうすい) — bebida refrescante"
  }
]
```

### D9 — Cuerpo y salud

```json
[
  {
    "jp": "体",
    "read": "タイ／からだ",
    "mean": "cuerpo",
    "type": "kanji",
    "extra": "体に悪い(からだにわるい) — malo para el cuerpo · 体力(たいりょく) — resistencia · 体重(たいじゅう) — peso corporal"
  },
  {
    "jp": "頭",
    "read": "ズ／あたま",
    "mean": "cabeza",
    "type": "kanji",
    "extra": "頭がいい(あたまがいい) — listo · 頭つう(ずつう) — dolor de cabeza"
  },
  {
    "jp": "顔",
    "read": "かお",
    "mean": "cara",
    "type": "kanji",
    "extra": "顔が赤い(かおがあかい) — cara roja · 顔いろが悪い(かおいろがわるい) — estar pálido · え顔(えがお) — sonrisa"
  },
  {
    "jp": "首",
    "read": "シュ／くび",
    "mean": "cuello",
    "type": "kanji",
    "extra": "手首(てくび) — muñeca · 足首(あしくび) — tobillo · 首都(しゅと) — capital"
  },
  {
    "jp": "心",
    "read": "シン／こころ",
    "mean": "corazón",
    "type": "kanji",
    "extra": "心が広い(こころがひろい) — tener buen corazón · 心ぱいします(しんぱいします) — preocuparse · 安心(あんしん) — tranquilidad · 心ぞう(しんぞう) — corazón (órgano)"
  },
  {
    "jp": "声",
    "read": "セイ／こえ",
    "mean": "voz",
    "type": "kanji",
    "extra": "声が大きい(こえがおおきい) — voz alta · 声ゆう(せいゆう) — actor de doblaje"
  },
  {
    "jp": "病",
    "read": "ビョウ／やまい",
    "mean": "enfermedad",
    "type": "kanji",
    "extra": "病気(びょうき) — enfermedad · 病いん(びょういん) — hospital · 急病(きゅうびょう) — enfermedad repentina"
  },
  {
    "jp": "薬",
    "read": "ヤク／ヤッ／くすり",
    "mean": "medicina",
    "type": "kanji",
    "extra": "薬を飲む(くすりをのむ) — tomar medicina · 目薬(めぐすり) — colirio · 薬きょく(やっきょく) — farmacia"
  },
  {
    "jp": "科",
    "read": "カ",
    "mean": "categoría",
    "type": "kanji",
    "extra": "科学(かがく) — ciencia · きょう科書(きょうかしょ) — libro de texto · 外科(げか) — cirugía"
  },
  {
    "jp": "内",
    "read": "ナイ／うち",
    "mean": "dentro",
    "type": "kanji",
    "extra": "内がわ(うちがわ) — interior · 車内(しゃない) — dentro del vehículo · 社内(しゃない) — dentro de la empresa · 内科(ないか) — medicina interna · あん内します(あんないします) — guiar"
  }
]
```

### D10 — Momentos del día y tiempo

```json
[
  {
    "jp": "朝",
    "read": "チョウ／あさ",
    "mean": "mañana",
    "type": "kanji",
    "extra": "毎朝(まいあさ) — cada mañana · 朝食(ちょうしょく) — desayuno · 今朝(けさ) — esta mañana"
  },
  {
    "jp": "昼",
    "read": "チュウ／ひる",
    "mean": "tarde, mediodía",
    "type": "kanji",
    "extra": "昼休み(ひるやすみ) — descanso del mediodía · 昼食(ちゅうしょく) — almuerzo · 昼ね(ひるね) — siesta"
  },
  {
    "jp": "夜",
    "read": "ヤ／よる／よ",
    "mean": "noche",
    "type": "kanji",
    "extra": "夜ごはん(よるごはん) — cena · 夜中(よなか) — medianoche · 夜行バス(やこうバス) — bus nocturno · 今夜(こんや) — esta noche"
  },
  {
    "jp": "夕",
    "read": "ゆう",
    "mean": "atardecer",
    "type": "kanji",
    "extra": "夕日(ゆうひ) — atardecer · 夕食(ゆうしょく) — cena · 夕方(ゆうがた) — atardecer"
  },
  {
    "jp": "方",
    "read": "ホウ／かた／がた",
    "mean": "forma de, dirección",
    "type": "kanji",
    "extra": "書き方(かきかた) — forma de escribir · あの方(あのかた) — aquella persona · 働き方(はたらきかた) — forma de trabajar · 方ほう(ほうほう) — método"
  },
  {
    "jp": "晩",
    "read": "バン",
    "mean": "noche",
    "type": "kanji",
    "extra": "今晩(こんばん) — esta noche · 毎晩(まいばん) — cada noche"
  },
  {
    "jp": "計",
    "read": "ケイ／はか（る）",
    "mean": "medir",
    "type": "kanji",
    "extra": "時間を計る(じかんをはかる) — medir tiempo · 時計(とけい) — reloj · 計画する(けいかくする) — planificar"
  },
  {
    "jp": "曜",
    "read": "ヨウ",
    "mean": "día de la semana",
    "type": "kanji",
    "extra": "月曜日(げつようび) — lunes · 火曜日(かようび) — martes · 水曜日(すいようび) — miércoles · 木曜日(もくようび) — jueves · 金曜日(きんようび) — viernes · 土曜日(どようび) — sábado · 日曜日(にちようび) — domingo"
  },
  {
    "jp": "以",
    "read": "イ",
    "mean": "a partir de",
    "type": "kanji",
    "extra": "以外(いがい) — excepto · 以上(いじょう) — más que · 以下(いか) — menos que · 以内(いない) — dentro de"
  },
  {
    "jp": "度",
    "read": "ド",
    "mean": "grado",
    "type": "kanji",
    "extra": "一度(いちど) — 1 vez, 1 grado · 何度も(なんども) — muchas veces · 今度(こんど) — próxima vez · おん度(おんど) — temperatura · おん度計(おんどけい) — termómetro"
  }
]
```

---

## CONTENIDO DEL VOCABULARIO (L26-L36, Minna no Nihongo)

### L26

```json
[
  { "jp": "見ます／診ます", "read": "みます", "mean": "ver, mirar, observar, examinar", "type": "verbo" },
  { "jp": "探します／捜します", "read": "さがします", "mean": "buscar", "type": "verbo" },
  { "jp": "(時間に)遅れます", "read": "おくれます", "mean": "llegar tarde", "type": "verbo" },
  { "jp": "(時間に)間に合います", "read": "まにあいます", "mean": "llegar a tiempo", "type": "verbo" },
  { "jp": "やります", "read": "やります", "mean": "hacer (por voluntad)", "type": "verbo" },
  { "jp": "拾います", "read": "ひろいます", "mean": "coger, recoger", "type": "verbo" },
  { "jp": "連絡します", "read": "れんらくします", "mean": "avisar, contactar", "type": "verbo" },
  { "jp": "気分がいい", "read": "きぶんがいい", "mean": "sentirse bien (físicamente)", "type": "expresion" },
  { "jp": "気分が悪い", "read": "きぶんがわるい", "mean": "sentirse mal (físicamente)", "type": "expresion" },
  { "jp": "運動会", "read": "うんどうかい", "mean": "evento deportivo", "type": "sustantivo" },
  { "jp": "盆踊り", "read": "ぼんおどり", "mean": "baile de la fiesta Bon", "type": "sustantivo" },
  { "jp": "フリーマーケット", "read": "フリーマーケット", "mean": "mercadillo", "type": "sustantivo" },
  { "jp": "場所", "read": "ばしょ", "mean": "lugar, ubicación", "type": "sustantivo" },
  { "jp": "ボランティア", "read": "ボランティア", "mean": "voluntariado", "type": "sustantivo" },
  { "jp": "財布", "read": "さいふ", "mean": "cartera, monedero", "type": "sustantivo" },
  { "jp": "ごみ", "read": "ごみ", "mean": "basura", "type": "sustantivo" },
  { "jp": "国会議事堂", "read": "こっかいぎじどう", "mean": "Palacio de la Dieta, parlamento", "type": "sustantivo" },
  { "jp": "平日", "read": "へいじつ", "mean": "días laborables", "type": "sustantivo" },
  { "jp": "〜弁", "read": "〜べん", "mean": "dialecto de", "type": "expresion" },
  { "jp": "今度", "read": "こんど", "mean": "la próxima vez", "type": "sustantivo" },
  { "jp": "ずいぶん", "read": "ずいぶん", "mean": "muy, bastante", "type": "adverbio" },
  { "jp": "直接", "read": "ちょくせつ", "mean": "directo, en persona", "type": "adverbio" },
  { "jp": "いつでも", "read": "いつでも", "mean": "en cualquier momento", "type": "adverbio" },
  { "jp": "どこでも", "read": "どこでも", "mean": "en cualquier sitio", "type": "adverbio" },
  { "jp": "誰でも", "read": "だれでも", "mean": "cualquier persona", "type": "expresion" },
  { "jp": "何でも", "read": "なんでも", "mean": "cualquier cosa", "type": "expresion" },
  { "jp": "こんな〜", "read": "こんな", "mean": "como este, tal", "type": "expresion" },
  { "jp": "そんな〜", "read": "そんな", "mean": "como ese, tal", "type": "expresion" },
  { "jp": "あんな〜", "read": "あんな", "mean": "como aquel", "type": "expresion" }
]
```

### L27

```json
[
  { "jp": "飼います", "read": "かいます", "mean": "criar/tener un animal", "type": "verbo" },
  { "jp": "(道を)走ります", "read": "はしります", "mean": "correr (por el camino)", "type": "verbo" },
  { "jp": "(山が)見えます", "read": "みえます", "mean": "se ve (algo)", "type": "verbo" },
  { "jp": "(音が)聞こえます", "read": "きこえます", "mean": "se oye (algo)", "type": "verbo" },
  { "jp": "(道が)できます", "read": "できます", "mean": "construirse, poder, ser capaz", "type": "verbo" },
  { "jp": "(教室を)開きます", "read": "ひらきます", "mean": "abrir, celebrar, organizar", "type": "verbo" },
  { "jp": "心配[な]", "read": "しんぱい", "mean": "preocupado, preocupante", "type": "adjetivo-na" },
  { "jp": "ペット", "read": "ペット", "mean": "mascota", "type": "sustantivo" },
  { "jp": "鳥", "read": "とり", "mean": "pájaro, ave", "type": "sustantivo" },
  { "jp": "声", "read": "こえ", "mean": "voz, canto", "type": "sustantivo" },
  { "jp": "波", "read": "なみ", "mean": "ola, onda", "type": "sustantivo" },
  { "jp": "花火", "read": "はなび", "mean": "fuegos artificiales", "type": "sustantivo" },
  { "jp": "道具", "read": "どうぐ", "mean": "herramienta, instrumento", "type": "sustantivo" },
  { "jp": "クリーニング", "read": "クリーニング", "mean": "tintorería, lavado en seco", "type": "sustantivo" },
  { "jp": "家", "read": "いえ／うち", "mean": "casa, hogar", "type": "sustantivo" },
  { "jp": "マンション", "read": "マンション", "mean": "edificio de apartamentos", "type": "sustantivo" },
  { "jp": "キッチン／台所", "read": "だいどころ", "mean": "cocina (lugar)", "type": "sustantivo" },
  { "jp": "〜教室", "read": "〜きょうしつ", "mean": "clase de", "type": "expresion" },
  { "jp": "パーティールーム", "read": "パーティールーム", "mean": "sala de fiestas", "type": "sustantivo" },
  { "jp": "方", "read": "かた", "mean": "persona (respetuoso)", "type": "sustantivo" },
  { "jp": "〜後", "read": "〜ご", "mean": "después de (tiempo)", "type": "expresion" },
  { "jp": "〜しか", "read": "〜しか", "mean": "no más que (con negativo)", "type": "expresion" },
  { "jp": "ほかの", "read": "ほかの", "mean": "otro", "type": "expresion" },
  { "jp": "はっきり", "read": "はっきり", "mean": "claramente", "type": "adverbio" }
]
```

### L28

```json
[
  { "jp": "(パンが)売れます", "read": "うれます", "mean": "venderse", "type": "verbo" },
  { "jp": "踊ります", "read": "おどります", "mean": "bailar", "type": "verbo" },
  { "jp": "かみます", "read": "かみます", "mean": "masticar, morder", "type": "verbo" },
  { "jp": "選びます", "read": "えらびます", "mean": "elegir, escoger", "type": "verbo" },
  { "jp": "(大学に)通います", "read": "かよいます", "mean": "ir, frecuentar", "type": "verbo" },
  { "jp": "メモします", "read": "メモします", "mean": "tomar notas, anotar", "type": "verbo" },
  { "jp": "まじめ", "read": "まじめ", "mean": "serio", "type": "adjetivo-na" },
  { "jp": "熱心[な]", "read": "ねっしん", "mean": "entusiasta, diligente", "type": "adjetivo-na" },
  { "jp": "えらい", "read": "えらい", "mean": "respetable, admirable", "type": "adjetivo-i" },
  { "jp": "ちょうどいい", "read": "ちょうどいい", "mean": "venir justo, apropiado", "type": "adjetivo-i" },
  { "jp": "景色", "read": "けしき", "mean": "paisaje", "type": "sustantivo" },
  { "jp": "美容院", "read": "びよういん", "mean": "salón de belleza, peluquería", "type": "sustantivo" },
  { "jp": "経験", "read": "けいけん", "mean": "experiencia", "type": "sustantivo" },
  { "jp": "力", "read": "ちから", "mean": "fuerza", "type": "sustantivo" },
  { "jp": "人気", "read": "にんき", "mean": "popularidad", "type": "sustantivo" },
  { "jp": "形", "read": "かたち", "mean": "forma, figura", "type": "sustantivo" },
  { "jp": "色", "read": "いろ", "mean": "color", "type": "sustantivo" },
  { "jp": "味", "read": "あじ", "mean": "sabor", "type": "sustantivo" },
  { "jp": "ガム", "read": "ガム", "mean": "chicle", "type": "sustantivo" },
  { "jp": "品物", "read": "しなもの", "mean": "productos, mercancías", "type": "sustantivo" },
  { "jp": "値段", "read": "ねだん", "mean": "precio", "type": "sustantivo" },
  { "jp": "給料", "read": "きゅうりょう", "mean": "sueldo, salario", "type": "sustantivo" },
  { "jp": "ボーナス", "read": "ボーナス", "mean": "paga extra, bonificación", "type": "sustantivo" },
  { "jp": "ゲーム", "read": "ゲーム", "mean": "juego, videojuego", "type": "sustantivo" },
  { "jp": "番組", "read": "ばんぐみ", "mean": "programa", "type": "sustantivo" },
  { "jp": "ドラマ", "read": "ドラマ", "mean": "drama, serie", "type": "sustantivo" },
  { "jp": "歌手", "read": "かしゅ", "mean": "cantante", "type": "sustantivo" },
  { "jp": "小説", "read": "しょうせつ", "mean": "novela", "type": "sustantivo" },
  { "jp": "小説家", "read": "しょうせつか", "mean": "novelista", "type": "sustantivo" },
  { "jp": "〜家", "read": "〜か", "mean": "experto en", "type": "expresion" },
  { "jp": "〜機", "read": "〜き", "mean": "máquina", "type": "expresion" },
  { "jp": "息子／息子さん", "read": "むすこ／むすこさん", "mean": "hijo", "type": "sustantivo" },
  { "jp": "娘／娘さん", "read": "むすめ／むすめさん", "mean": "hija", "type": "sustantivo" }
]
```

### L29

```json
[
  { "jp": "開きます", "read": "あきます", "mean": "abrirse (puerta)", "type": "verbo" },
  { "jp": "閉まります", "read": "しまります", "mean": "cerrarse (puerta)", "type": "verbo" },
  { "jp": "(電気が)点きます", "read": "つきます", "mean": "encenderse (luz)", "type": "verbo" },
  { "jp": "(電気が)消えます", "read": "きえます", "mean": "apagarse (luz)", "type": "verbo" },
  { "jp": "(椅子が)壊れます", "read": "こわれます", "mean": "romperse (máquina)", "type": "verbo" },
  { "jp": "(コップが)割れます", "read": "われます", "mean": "romperse (vaso)", "type": "verbo" },
  { "jp": "(木が)折れます", "read": "おれます", "mean": "romperse (árbol)", "type": "verbo" },
  { "jp": "(紙が)破れます", "read": "やぶれます", "mean": "rasgarse (papel)", "type": "verbo" },
  { "jp": "(服が)汚れます", "read": "よごれます", "mean": "ensuciarse (ropa)", "type": "verbo" },
  { "jp": "(ポケットが)付きます", "read": "つきます", "mean": "estar puesto (un bolsillo)", "type": "verbo" },
  { "jp": "(ボタンが)外れます", "read": "はずれます", "mean": "salirse, desbotonarse", "type": "verbo" },
  { "jp": "(車が)止まります", "read": "とまります", "mean": "detenerse", "type": "verbo" },
  { "jp": "(鍵が)かかります", "read": "かかります", "mean": "cerrarse con llave", "type": "verbo" },
  { "jp": "間違えます", "read": "まちがえます", "mean": "equivocarse", "type": "verbo" },
  { "jp": "落とします", "read": "おとします", "mean": "perder algo sin darse cuenta", "type": "verbo" },
  { "jp": "拭きます", "read": "ふきます", "mean": "limpiar con trapo", "type": "verbo" },
  { "jp": "取り替えます", "read": "とりかえます", "mean": "cambiar, reemplazar", "type": "verbo" },
  { "jp": "片付けます", "read": "かたづけます", "mean": "ordenar, poner en orden", "type": "verbo" },
  { "jp": "[お]皿", "read": "[お]さら", "mean": "plato", "type": "sustantivo" },
  { "jp": "[お]茶碗", "read": "[お]ちゃわん", "mean": "taza/cuenco", "type": "sustantivo" },
  { "jp": "コップ", "read": "コップ", "mean": "vaso", "type": "sustantivo" },
  { "jp": "ガラス", "read": "ガラス", "mean": "vidrio, cristal", "type": "sustantivo" },
  { "jp": "袋", "read": "ふくろ", "mean": "bolsa", "type": "sustantivo" },
  { "jp": "書類", "read": "しょるい", "mean": "papel, documento", "type": "sustantivo" },
  { "jp": "枝", "read": "えだ", "mean": "rama de árbol", "type": "sustantivo" },
  { "jp": "駅員", "read": "えきいん", "mean": "empleado de la estación", "type": "sustantivo" },
  { "jp": "交番", "read": "こうばん", "mean": "puesto de policía", "type": "sustantivo" },
  { "jp": "スピーチ", "read": "スピーチ", "mean": "discurso", "type": "sustantivo" },
  { "jp": "返事", "read": "へんじ", "mean": "respuesta", "type": "sustantivo" },
  { "jp": "お先にどうぞ", "read": "おさきにどうぞ", "mean": "Pase usted, Adelante por favor", "type": "expresion" }
]
```

### L30

```json
[
  { "jp": "貼ります", "read": "はります", "mean": "pegar, fijar", "type": "verbo" },
  { "jp": "掛けます", "read": "かけます", "mean": "colgar", "type": "verbo" },
  { "jp": "飾ります", "read": "かざります", "mean": "decorar, adornar", "type": "verbo" },
  { "jp": "並べます", "read": "ならべます", "mean": "poner en fila, alinear", "type": "verbo" },
  { "jp": "植えます", "read": "うえます", "mean": "plantar", "type": "verbo" },
  { "jp": "戻します", "read": "もどします", "mean": "devolver, restaurar", "type": "verbo" },
  { "jp": "まとめます", "read": "まとめます", "mean": "reunir, resumir, compilar", "type": "verbo" },
  { "jp": "しまいます", "read": "しまいます", "mean": "guardar, poner en su lugar", "type": "verbo" },
  { "jp": "決めます", "read": "きめます", "mean": "decidir, determinar", "type": "verbo" },
  { "jp": "予習します", "read": "よしゅうします", "mean": "preparar la lección", "type": "verbo" },
  { "jp": "復習します", "read": "ふくしゅうします", "mean": "repasar la lección", "type": "verbo" },
  { "jp": "そのままにします", "read": "そのままにします", "mean": "dejar las cosas como están", "type": "verbo" },
  { "jp": "授業", "read": "じゅぎょう", "mean": "clase, lección", "type": "sustantivo" },
  { "jp": "講義", "read": "こうぎ", "mean": "conferencia, clase de universidad", "type": "sustantivo" },
  { "jp": "ミーティング", "read": "ミーティング", "mean": "reunión", "type": "sustantivo" },
  { "jp": "予定", "read": "よてい", "mean": "plan, programa", "type": "sustantivo" },
  { "jp": "予定表", "read": "よていひょう", "mean": "agenda, horario", "type": "sustantivo" },
  { "jp": "お知らせ", "read": "おしらせ", "mean": "aviso, notificación", "type": "sustantivo" },
  { "jp": "ガイドブック", "read": "ガイドブック", "mean": "guía", "type": "sustantivo" },
  { "jp": "カレンダー", "read": "カレンダー", "mean": "calendario", "type": "sustantivo" },
  { "jp": "ポスター", "read": "ポスター", "mean": "póster, cartel", "type": "sustantivo" },
  { "jp": "ゴミ箱", "read": "ゴミばこ", "mean": "papelera, cubo de la basura", "type": "sustantivo" },
  { "jp": "人形", "read": "にんぎょう", "mean": "muñeco, muñeca", "type": "sustantivo" },
  { "jp": "花瓶", "read": "かびん", "mean": "florero", "type": "sustantivo" },
  { "jp": "鏡", "read": "かがみ", "mean": "espejo", "type": "sustantivo" },
  { "jp": "引き出し", "read": "ひきだし", "mean": "cajón", "type": "sustantivo" },
  { "jp": "玄関", "read": "げんかん", "mean": "vestíbulo", "type": "sustantivo" },
  { "jp": "廊下", "read": "ろうか", "mean": "pasillo", "type": "sustantivo" },
  { "jp": "壁", "read": "かべ", "mean": "pared", "type": "sustantivo" },
  { "jp": "池", "read": "いけ", "mean": "charca, estanque", "type": "sustantivo" },
  { "jp": "元の所", "read": "もとのところ", "mean": "lugar original", "type": "sustantivo" },
  { "jp": "周り", "read": "まわり", "mean": "alrededor", "type": "sustantivo" },
  { "jp": "真ん中", "read": "まんなか", "mean": "en el centro", "type": "sustantivo" },
  { "jp": "隅", "read": "すみ", "mean": "rincón, esquina", "type": "sustantivo" },
  { "jp": "まだ", "read": "まだ", "mean": "todavía", "type": "adverbio" }
]
```

### L31

```json
[
  { "jp": "続けます", "read": "つづけます", "mean": "continuar, seguir", "type": "verbo" },
  { "jp": "見つけます", "read": "みつけます", "mean": "encontrar", "type": "verbo" },
  { "jp": "(休みを)取ります", "read": "とります", "mean": "coger vacaciones, tomar descanso", "type": "verbo" },
  { "jp": "(試験を)受けます", "read": "うけます", "mean": "presentarse a un examen", "type": "verbo" },
  { "jp": "申し込みます", "read": "もうしこみます", "mean": "inscribirse, solicitar", "type": "verbo" },
  { "jp": "休憩します", "read": "きゅうけいします", "mean": "hacer una pausa", "type": "verbo" },
  { "jp": "連休", "read": "れんきゅう", "mean": "días festivos consecutivos, puente", "type": "sustantivo" },
  { "jp": "作文", "read": "さくぶん", "mean": "redacción, composición", "type": "sustantivo" },
  { "jp": "発表", "read": "はっぴょう", "mean": "presentación, anuncio", "type": "sustantivo" },
  { "jp": "展覧会", "read": "てんらんかい", "mean": "exposición", "type": "sustantivo" },
  { "jp": "結婚式", "read": "けっこんしき", "mean": "boda", "type": "sustantivo" },
  { "jp": "[お]葬式", "read": "[お]そうしき", "mean": "funeral", "type": "sustantivo" },
  { "jp": "式", "read": "しき", "mean": "ceremonia", "type": "sustantivo" },
  { "jp": "本社", "read": "ほんしゃ", "mean": "oficina central", "type": "sustantivo" },
  { "jp": "支店", "read": "してん", "mean": "sucursal", "type": "sustantivo" },
  { "jp": "教会", "read": "きょうかい", "mean": "iglesia", "type": "sustantivo" },
  { "jp": "大学院", "read": "だいがくいん", "mean": "escuela de posgrado", "type": "sustantivo" },
  { "jp": "動物園", "read": "どうぶつえん", "mean": "zoológico", "type": "sustantivo" },
  { "jp": "温泉", "read": "おんせん", "mean": "aguas termales", "type": "sustantivo" },
  { "jp": "帰り", "read": "かえり", "mean": "vuelta", "type": "sustantivo" },
  { "jp": "お子さん", "read": "おこさん", "mean": "hijo/a (tuyo)", "type": "sustantivo" },
  { "jp": "〜号", "read": "〜ごう", "mean": "número (de tren, tifón)", "type": "expresion" },
  { "jp": "〜の方", "read": "〜のほう", "mean": "en dirección a, hacia", "type": "expresion" },
  { "jp": "ずっと", "read": "ずっと", "mean": "todo el tiempo", "type": "adverbio" }
]
```

### L32

```json
[
  { "jp": "運動します", "read": "うんどうします", "mean": "hacer ejercicio", "type": "verbo" },
  { "jp": "成功します", "read": "せいこうします", "mean": "tener éxito", "type": "verbo" },
  { "jp": "(試験に)失敗します", "read": "しっぱいします", "mean": "fracasar (en examen)", "type": "verbo" },
  { "jp": "(試験に)合格します", "read": "ごうかくします", "mean": "aprobar (examen)", "type": "verbo" },
  { "jp": "(雨が)止みます", "read": "やみます", "mean": "dejar de llover", "type": "verbo" },
  { "jp": "晴れます", "read": "はれます", "mean": "despejarse", "type": "verbo" },
  { "jp": "曇ります", "read": "くもります", "mean": "nublarse", "type": "verbo" },
  { "jp": "(熱が)続きます", "read": "つづきます", "mean": "continuar (fiebre)", "type": "verbo" },
  { "jp": "(風邪を)引きます", "read": "ひきます", "mean": "coger un resfriado", "type": "verbo" },
  { "jp": "冷やします", "read": "ひやします", "mean": "enfriar", "type": "verbo" },
  { "jp": "(道が)込みます／混みます", "read": "こみます", "mean": "congestionarse (camino)", "type": "verbo" },
  { "jp": "(道が)空きます", "read": "すきます", "mean": "descongestionarse", "type": "verbo" },
  { "jp": "出ます", "read": "でます", "mean": "participar (partido/fiesta)", "type": "verbo" },
  { "jp": "無理をします", "read": "むりをします", "mean": "esforzarse demasiado", "type": "verbo" },
  { "jp": "十分[な]", "read": "じゅうぶん", "mean": "suficiente", "type": "adjetivo-na" },
  { "jp": "おかしい", "read": "おかしい", "mean": "extraño, raro, ridículo", "type": "adjetivo-i" },
  { "jp": "うるさい", "read": "うるさい", "mean": "ruidoso", "type": "adjetivo-i" },
  { "jp": "やけど", "read": "やけど", "mean": "quemadura", "type": "sustantivo" },
  { "jp": "けが", "read": "けが", "mean": "lesión, herida", "type": "sustantivo" },
  { "jp": "せき", "read": "せき", "mean": "tos", "type": "sustantivo" },
  { "jp": "インフルエンザ", "read": "インフルエンザ", "mean": "gripe", "type": "sustantivo" },
  { "jp": "空", "read": "そら", "mean": "cielo", "type": "sustantivo" },
  { "jp": "太陽", "read": "たいよう", "mean": "sol", "type": "sustantivo" },
  { "jp": "星", "read": "ほし", "mean": "estrella", "type": "sustantivo" },
  { "jp": "風", "read": "かぜ", "mean": "viento", "type": "sustantivo" },
  { "jp": "東", "read": "ひがし", "mean": "este", "type": "sustantivo" },
  { "jp": "西", "read": "にし", "mean": "oeste", "type": "sustantivo" },
  { "jp": "南", "read": "みなみ", "mean": "sur", "type": "sustantivo" },
  { "jp": "北", "read": "きた", "mean": "norte", "type": "sustantivo" },
  { "jp": "国際〜", "read": "こくさい", "mean": "internacional", "type": "expresion" },
  { "jp": "水道", "read": "すいどう", "mean": "agua corriente", "type": "sustantivo" },
  { "jp": "先生", "read": "せんせい", "mean": "médico, doctor", "type": "sustantivo" }
]
```

### L33

```json
[
  { "jp": "捨てます", "read": "すてます", "mean": "tirar", "type": "verbo" },
  { "jp": "逃げます", "read": "にげます", "mean": "escapar, huir", "type": "verbo" },
  { "jp": "騒ぎます", "read": "さわぎます", "mean": "hacer ruido", "type": "verbo" },
  { "jp": "諦めます", "read": "あきらめます", "mean": "rendirse, desistir", "type": "verbo" },
  { "jp": "投げます", "read": "なげます", "mean": "lanzar", "type": "verbo" },
  { "jp": "守ります", "read": "まもります", "mean": "proteger, respetar (leyes)", "type": "verbo" },
  { "jp": "(式が)始まります", "read": "はじまります", "mean": "empezar (ceremonia)", "type": "verbo" },
  { "jp": "出席します", "read": "しゅっせきします", "mean": "asistir a una reunión", "type": "verbo" },
  { "jp": "伝えます", "read": "つたえます", "mean": "comunicar, transmitir", "type": "verbo" },
  { "jp": "注意します", "read": "ちゅういします", "mean": "tener cuidado", "type": "verbo" },
  { "jp": "(席を)外します", "read": "はずします", "mean": "dejar el asiento, quitar", "type": "verbo" },
  { "jp": "戻ります", "read": "もどります", "mean": "volver, regresar", "type": "verbo" },
  { "jp": "(電話が)あります", "read": "あります", "mean": "haber/tener (una llamada)", "type": "verbo" },
  { "jp": "だめ[な]", "read": "だめ", "mean": "no permitido, inútil, imposible", "type": "adjetivo-na" },
  { "jp": "同じ", "read": "おなじ", "mean": "igual, mismo", "type": "expresion" },
  { "jp": "警察", "read": "けいさつ", "mean": "policía", "type": "sustantivo" },
  { "jp": "席", "read": "せき", "mean": "asiento", "type": "sustantivo" },
  { "jp": "マーク", "read": "マーク", "mean": "marca, símbolo", "type": "sustantivo" },
  { "jp": "ボール", "read": "ボール", "mean": "pelota, balón", "type": "sustantivo" },
  { "jp": "締め切り", "read": "しめきり", "mean": "plazo, fecha límite", "type": "sustantivo" },
  { "jp": "規則", "read": "きそく", "mean": "regla, reglamento", "type": "sustantivo" },
  { "jp": "危険", "read": "きけん", "mean": "peligro, peligroso", "type": "sustantivo" },
  { "jp": "使用禁止", "read": "しようきんし", "mean": "prohibido el uso", "type": "expresion" },
  { "jp": "立ち入り禁止", "read": "たちいりきんし", "mean": "prohibida la entrada", "type": "expresion" },
  { "jp": "徐行", "read": "じょこう", "mean": "despacio, poca velocidad", "type": "expresion" },
  { "jp": "入口／入り口", "read": "いりぐち", "mean": "entrada", "type": "sustantivo" },
  { "jp": "出口", "read": "でぐち", "mean": "salida", "type": "sustantivo" },
  { "jp": "非常口", "read": "ひじょうぐち", "mean": "salida de emergencia", "type": "sustantivo" },
  { "jp": "無料", "read": "むりょう", "mean": "gratis", "type": "sustantivo" },
  { "jp": "割引", "read": "わりびき", "mean": "descuento", "type": "sustantivo" },
  { "jp": "飲み放題", "read": "のみほうだい", "mean": "barra libre", "type": "sustantivo" },
  { "jp": "使用中", "read": "しようちゅう", "mean": "en uso", "type": "expresion" },
  { "jp": "募集中", "read": "ぼしゅうちゅう", "mean": "se busca", "type": "expresion" },
  { "jp": "〜中", "read": "〜ちゅう", "mean": "durante, mientras", "type": "expresion" },
  { "jp": "どういう〜", "read": "どういう", "mean": "de qué modo, qué tipo de", "type": "expresion" }
]
```

### L34

```json
[
  { "jp": "(歯を)磨きます", "read": "みがきます", "mean": "lavarse los dientes, pulir", "type": "verbo" },
  { "jp": "組み立てます", "read": "くみたてます", "mean": "montar, ensamblar", "type": "verbo" },
  { "jp": "折ります", "read": "おります", "mean": "doblar, romper, partir", "type": "verbo" },
  { "jp": "(忘れ物に)気がつきます", "read": "きがつきます", "mean": "darse cuenta", "type": "verbo" },
  { "jp": "(しょうゆを)つけます", "read": "つけます", "mean": "añadir/echar (salsa)", "type": "verbo" },
  { "jp": "(鍵が)見つかります", "read": "みつかります", "mean": "ser encontrado (llave)", "type": "verbo" },
  { "jp": "質問します", "read": "しつもんします", "mean": "preguntar, hacer pregunta", "type": "verbo" },
  { "jp": "(傘を)さします", "read": "さします", "mean": "abrir/usar el paraguas", "type": "verbo" },
  { "jp": "スポーツクラブ", "read": "スポーツクラブ", "mean": "gimnasio, club deportivo", "type": "sustantivo" },
  { "jp": "[お]城", "read": "[お]しろ", "mean": "castillo", "type": "sustantivo" },
  { "jp": "説明書", "read": "せつめいしょ", "mean": "manual, folleto de instrucciones", "type": "sustantivo" },
  { "jp": "図", "read": "ず", "mean": "figura, plano", "type": "sustantivo" },
  { "jp": "線", "read": "せん", "mean": "línea", "type": "sustantivo" },
  { "jp": "矢印", "read": "やじるし", "mean": "flecha (señal)", "type": "sustantivo" },
  { "jp": "黒", "read": "くろ", "mean": "negro", "type": "sustantivo" },
  { "jp": "白", "read": "しろ", "mean": "blanco", "type": "sustantivo" },
  { "jp": "赤", "read": "あか", "mean": "rojo", "type": "sustantivo" },
  { "jp": "青", "read": "あお", "mean": "azul", "type": "sustantivo" },
  { "jp": "紺", "read": "こん", "mean": "azul oscuro, marino", "type": "sustantivo" },
  { "jp": "黄色", "read": "きいろ", "mean": "amarillo", "type": "sustantivo" },
  { "jp": "茶色", "read": "ちゃいろ", "mean": "marrón", "type": "sustantivo" },
  { "jp": "しょうゆ", "read": "しょうゆ", "mean": "salsa de soja", "type": "sustantivo" },
  { "jp": "ソース", "read": "ソース", "mean": "salsa, salsa inglesa", "type": "sustantivo" },
  { "jp": "お客[さん]", "read": "おきゃく[さん]", "mean": "visitante, cliente", "type": "sustantivo" },
  { "jp": "〜か〜", "read": "〜か〜", "mean": "o", "type": "expresion" },
  { "jp": "ゆうべ", "read": "ゆうべ", "mean": "anoche", "type": "adverbio" },
  { "jp": "さっき", "read": "さっき", "mean": "hace un rato", "type": "adverbio" },
  { "jp": "エンジン", "read": "エンジン", "mean": "motor", "type": "sustantivo" },
  { "jp": "チーム", "read": "チーム", "mean": "equipo", "type": "sustantivo" },
  { "jp": "今夜", "read": "こんや", "mean": "esta noche", "type": "sustantivo" },
  { "jp": "夕方", "read": "ゆうがた", "mean": "tarde, atardecer", "type": "sustantivo" },
  { "jp": "前", "read": "まえ", "mean": "hace (tiempo), antes de, delante de", "type": "expresion" },
  { "jp": "遅く", "read": "おそく", "mean": "tarde, con retraso", "type": "adverbio" },
  { "jp": "こんなに", "read": "こんなに", "mean": "tan así, de este modo", "type": "expresion" },
  { "jp": "そんなに", "read": "そんなに", "mean": "tan así (cerca del oyente)", "type": "expresion" },
  { "jp": "あんなに", "read": "あんなに", "mean": "tan así (lejano)", "type": "expresion" }
]
```

### L35

```json
[
  { "jp": "(花が)咲きます", "read": "さきます", "mean": "florecer", "type": "verbo" },
  { "jp": "(色が)変わります", "read": "かわります", "mean": "cambiar, transformarse", "type": "verbo" },
  { "jp": "困ります", "read": "こまります", "mean": "tener problemas, estar en apuros", "type": "verbo" },
  { "jp": "(丸を)付けます", "read": "つけます", "mean": "marcar (con círculo)", "type": "verbo" },
  { "jp": "(病気が)治ります", "read": "なおります", "mean": "curarse (enfermedad)", "type": "verbo" },
  { "jp": "(故障が)直ります", "read": "なおります", "mean": "repararse (avería)", "type": "verbo" },
  { "jp": "クリックします", "read": "クリックします", "mean": "hacer clic", "type": "verbo" },
  { "jp": "入力します", "read": "にゅうりょくします", "mean": "introducir datos", "type": "verbo" },
  { "jp": "正しい", "read": "ただしい", "mean": "correcto, justo", "type": "adjetivo-i" },
  { "jp": "向こう", "read": "むこう", "mean": "allá, otro lado", "type": "sustantivo" },
  { "jp": "島", "read": "しま", "mean": "isla", "type": "sustantivo" },
  { "jp": "港", "read": "みなと", "mean": "puerto", "type": "sustantivo" },
  { "jp": "近所", "read": "きんじょ", "mean": "vecindario, vecindad", "type": "sustantivo" },
  { "jp": "屋上", "read": "おくじょう", "mean": "azotea, terraza", "type": "sustantivo" },
  { "jp": "海外", "read": "かいがい", "mean": "el extranjero", "type": "sustantivo" },
  { "jp": "山登り", "read": "やまのぼり", "mean": "alpinismo, montañismo", "type": "sustantivo" },
  { "jp": "歴史", "read": "れきし", "mean": "historia", "type": "sustantivo" },
  { "jp": "機会", "read": "きかい", "mean": "oportunidad, ocasión", "type": "sustantivo" },
  { "jp": "許可", "read": "きょか", "mean": "permiso", "type": "sustantivo" },
  { "jp": "丸", "read": "まる", "mean": "círculo", "type": "sustantivo" },
  { "jp": "振り仮名", "read": "ふりがな", "mean": "furigana (lectura de kanji en kana)", "type": "sustantivo" },
  { "jp": "設備", "read": "せつび", "mean": "instalación", "type": "sustantivo" },
  { "jp": "レバー", "read": "レバー", "mean": "palanca", "type": "sustantivo" },
  { "jp": "キー", "read": "キー", "mean": "tecla", "type": "sustantivo" },
  { "jp": "カーテン", "read": "カーテン", "mean": "cortina", "type": "sustantivo" },
  { "jp": "紐", "read": "ひも", "mean": "cordón", "type": "sustantivo" },
  { "jp": "炊飯器", "read": "すいはんき", "mean": "arrocera", "type": "sustantivo" },
  { "jp": "葉", "read": "は", "mean": "hoja (planta)", "type": "sustantivo" },
  { "jp": "昔", "read": "むかし", "mean": "el pasado, tiempos antiguos", "type": "sustantivo" },
  { "jp": "もっと", "read": "もっと", "mean": "más", "type": "adverbio" },
  { "jp": "これで終わりましょう", "read": "これでおわりましょう", "mean": "Terminemos entonces", "type": "expresion" }
]
```

### L36

```json
[
  { "jp": "(事故に)遭います", "read": "あいます", "mean": "encontrarse con (accidente)", "type": "verbo" },
  { "jp": "貯金します", "read": "ちょきんします", "mean": "ahorrar dinero", "type": "verbo" },
  { "jp": "(7時を)過ぎます", "read": "すぎます", "mean": "pasar (las siete)", "type": "verbo" },
  { "jp": "(仕事に)慣れます", "read": "なれます", "mean": "acostumbrarse (al trabajo)", "type": "verbo" },
  { "jp": "(食べ物が)腐ります", "read": "くさります", "mean": "pudrirse (comida)", "type": "verbo" },
  { "jp": "剣道", "read": "けんどう", "mean": "kendo (esgrima japonesa)", "type": "sustantivo" },
  { "jp": "柔道", "read": "じゅうどう", "mean": "judo", "type": "sustantivo" },
  { "jp": "ラッシュ", "read": "ラッシュ", "mean": "hora punta", "type": "sustantivo" },
  { "jp": "宇宙", "read": "うちゅう", "mean": "universo, espacio", "type": "sustantivo" },
  { "jp": "曲", "read": "きょく", "mean": "pieza musical, canción", "type": "sustantivo" },
  { "jp": "毎週", "read": "まいしゅう", "mean": "todas las semanas, semanalmente", "type": "adverbio" },
  { "jp": "毎月", "read": "まいつき", "mean": "todos los meses, mensualmente", "type": "adverbio" },
  { "jp": "毎年", "read": "まいとし", "mean": "todos los años, anualmente", "type": "adverbio" },
  { "jp": "このごろ", "read": "このごろ", "mean": "últimamente", "type": "adverbio" },
  { "jp": "やっと", "read": "やっと", "mean": "por fin, finalmente", "type": "adverbio" },
  { "jp": "かなり", "read": "かなり", "mean": "bastante", "type": "adverbio" },
  { "jp": "必ず", "read": "かならず", "mean": "sin falta", "type": "adverbio" },
  { "jp": "絶対に", "read": "ぜったいに", "mean": "de ninguna manera, en absoluto", "type": "adverbio" },
  { "jp": "上手に", "read": "じょうずに", "mean": "bien, hábilmente", "type": "adverbio" },
  { "jp": "できるだけ", "read": "できるだけ", "mean": "en la medida de lo posible", "type": "adverbio" },
  { "jp": "ほとんど", "read": "ほとんど", "mean": "casi, apenas", "type": "adverbio" }
]
```

---

## Tareas para Claude Code

1. **Crear la estructura de carpetas** descrita arriba.
2. **Crear los 21 archivos JSON** (10 de kanji D1-D10 + 11 de vocabulario L26-L36) con los datos proporcionados.
3. **Implementar `index.html`** con la estructura de pantallas: home, flashcards, test, repaso, fin de sesión, estadísticas.
4. **Implementar `css/style.css`** con el diseño japonés sugerido + modo oscuro + responsive.
5. **Implementar `js/data.js`** que cargue los JSON al arrancar (con `fetch`) y los exponga.
6. **Implementar `js/progress.js`** con:
   - `getProgress()`, `setFailWeight(cardKey, delta)`, `getFailedCards()`
   - `exportProgress()` → descarga JSON
   - `importProgress(file)` → sobrescribe localStorage
7. **Implementar `js/app.js`** con toda la lógica de navegación, sesiones y modos (flashcards, test con tipos gramaticales agrupados, repaso).
8. **Probar que funciona** abriendo `index.html` localmente.
9. **Crear un `README.md`** con instrucciones de despliegue en GitHub Pages.

## Reglas clave a no olvidar

- **Test: las 4 opciones SIEMPRE del mismo tipo gramatical** que la respuesta correcta. Verde la correcta, rojo las incorrectas al responder.
- **Progreso persistente** entre sesiones vía localStorage.
- **Exportar/importar** progreso a archivo JSON.
- **Sin frameworks**, sin npm, sin build. HTML/CSS/JS puro.
- **Móvil first** + responsive + modo oscuro automático.
- **Diseño japonés sutil**, no kitsch (bermellón + papel washi + tinta negra).

## Próximas funcionalidades (no implementar ya, anotar para futuro)

- Estadísticas detalladas con gráficos (Chart.js opcional desde CDN)
- Modo "escribir respuesta" además de opción múltiple
- Modo "Español → Japonés" (ahora solo Japonés → Español)
- Audio TTS para escuchar la pronunciación
- Sincronización en la nube (Supabase / Firebase) si la usuaria lo pide
- Añadir más bloques de kanji (J4, J5...) y lecciones (L37+) según avance el curso

## Notas adicionales

- La usuaria habla español de España (Madrid). Usar terminología española peninsular ("ordenador" no "computadora", "móvil" no "celular", etc.).
- Los datos están revisados por la usuaria — no inventar lecturas ni significados al rellenar; si falta info, preguntar antes.
- La usuaria conoce los 204 kanji previos (J2 + J3 D1-D10), pero la app debe funcionar incluso para alguien que esté empezando.
