import type { StoryCatalogItem, StoryId } from './types';

export const STORY_CATALOG: StoryCatalogItem[] = [
  // Nuevo Testamento (5 historias)
  {
    id: 'zaqueo',
    title: 'Zaqueo en Jericó',
    testament: 'nuevo',
    testamentLabel: 'Nuevo Testamento',
    reference: 'Lucas 19:1–10',
    summary: 'Cruza la ciudad, trepa al gran sicómoro y recibe a Jesús en tu casa.',
    hudDark: false,
    victoryVerse:
      '«Hoy ha venido la salvación a esta casa; porque el Hijo del Hombre vino a buscar y a salvar lo que se había perdido.»',
    victoryRef: 'Lucas 19:9–10',
    defeatVerse:
      '«Mira que estoy a la puerta y llamo; si alguno oye mi voz y abre la puerta, entraré a él.»',
    defeatRef: 'Apocalipsis 3:20',
  },
  {
    id: 'flujo',
    title: 'La Mujer de Fe',
    testament: 'nuevo',
    testamentLabel: 'Nuevo Testamento',
    reference: 'Marcos 5:25–34',
    summary: 'Ábrete paso entre la multitud de Capernaúm hasta tocar el borde del manto de Jesús.',
    hudDark: false,
    victoryVerse:
      '«Hija, tu fe te ha hecho salva; ve en paz, y queda sana de tu azote.»',
    victoryRef: 'Marcos 5:34',
    defeatVerse:
      '«No temas, cree solamente, y será salva.»',
    defeatRef: 'Lucas 8:50',
  },
  {
    id: 'bartimeo',
    title: 'El Ciego Bartimeo',
    testament: 'nuevo',
    testamentLabel: 'Nuevo Testamento',
    reference: 'Marcos 10:46–52',
    summary: 'Clama con fe junto a la puerta de Jericó hasta que Jesús te llame y devuelva la vista.',
    hudDark: false,
    victoryVerse:
      '«Vete, tu fe te ha salvado. Y en seguida recobró la vista, y seguía a Jesús en el camino.»',
    victoryRef: 'Marcos 10:52',
    defeatVerse:
      '«Ten confianza; levántate, te llama.»',
    defeatRef: 'Marcos 10:49',
  },
  {
    id: 'panes',
    title: 'Cinco Panes y Dos Peces',
    testament: 'nuevo',
    testamentLabel: 'Nuevo Testamento',
    reference: 'Juan 6:1–14',
    summary: 'Lleva tu canasta a Jesús y comparte el milagro multiplicado con toda la multitud en Galilea.',
    hudDark: false,
    victoryVerse:
      '«Tomó Jesús aquellos panes, y habiendo dado gracias, los repartió entre los que estaban recostados.»',
    victoryRef: 'Juan 6:11',
    defeatVerse:
      '«Yo soy el pan de vida; el que a mí viene, nunca tendrá hambre.»',
    defeatRef: 'Juan 6:35',
  },
  {
    id: 'tormenta',
    title: 'Jesús Calma la Tempestad',
    testament: 'nuevo',
    testamentLabel: 'Nuevo Testamento',
    reference: 'Marcos 4:35–41',
    summary: 'Salta las olas en la barca de Galilea, asegura las velas y despierta a Jesús en medio del mar.',
    hudDark: true,
    victoryVerse:
      '«Y levantándose, reprendió al viento, y dijo al mar: ¡Calla, enmudece! Y cesó el viento, y se hizo grande bonanza.»',
    victoryRef: 'Marcos 4:39',
    defeatVerse:
      '«¿Por qué estáis así amedrentados? ¿Cómo no tenéis fe?»',
    defeatRef: 'Marcos 4:40',
  },

  // Antiguo Testamento (5 historias)
  {
    id: 'daniel',
    title: 'Daniel y los Leones',
    testament: 'antiguo',
    testamentLabel: 'Antiguo Testamento',
    reference: 'Daniel 6',
    summary: 'Ora con fidelidad hacia Jerusalén y confía en el ángel dentro del foso de los leones.',
    hudDark: true,
    victoryVerse:
      '«Mi Dios envió su ángel, el cual cerró la boca de los leones, para que no me hiciesen daño.»',
    victoryRef: 'Daniel 6:22',
    defeatVerse:
      '«Sé fuerte y valiente; no temas ni te desanimes, porque el Señor tu Dios estará contigo.»',
    defeatRef: 'Josué 1:9',
  },
  {
    id: 'david',
    title: 'David y Goliat',
    testament: 'antiguo',
    testamentLabel: 'Antiguo Testamento',
    reference: '1 Samuel 17',
    summary: 'Recoge piedras lisas del arroyo en el valle de Ela y vence al gigante con fe y tu honda.',
    hudDark: false,
    victoryVerse:
      '«Yo vengo a ti en el nombre del Señor de los ejércitos, el Dios de los escuadrones de Israel.»',
    victoryRef: '1 Samuel 17:45',
    defeatVerse:
      '«No es con espada ni con lanza que el Señor salva; porque del Señor es la batalla.»',
    defeatRef: '1 Samuel 17:47',
  },
  {
    id: 'horno',
    title: 'El Horno de Fuego',
    testament: 'antiguo',
    testamentLabel: 'Antiguo Testamento',
    reference: 'Daniel 3',
    summary: 'Camina con Sadrac, Mesac y Abed-nego protegido por el rocío celestial del Cuarto Varón.',
    hudDark: true,
    victoryVerse:
      '«He aquí yo veo cuatro varones sueltos, que se pasean en medio del fuego sin sufrir ningún daño.»',
    victoryRef: 'Daniel 3:25',
    defeatVerse:
      '«Nuestro Dios a quien servimos puede librarnos del horno de fuego ardiendo.»',
    defeatRef: 'Daniel 3:17',
  },
  {
    id: 'moises',
    title: 'Moisés y el Mar Rojo',
    testament: 'antiguo',
    testamentLabel: 'Antiguo Testamento',
    reference: 'Éxodo 14',
    summary: 'Alza tu vara para abrir las aguas del Mar Rojo y guía al pueblo en seco hacia la otra orilla.',
    hudDark: false,
    victoryVerse:
      '«No temáis; estad firmes, y ved la salvación que el Señor hará hoy con vosotros.»',
    victoryRef: 'Éxodo 14:13',
    defeatVerse:
      '«El Señor peleará por vosotros, y vosotros estaréis tranquilos.»',
    defeatRef: 'Éxodo 14:14',
  },
  {
    id: 'noe',
    title: 'Noé y el Arca',
    testament: 'antiguo',
    testamentLabel: 'Antiguo Testamento',
    reference: 'Génesis 6–8',
    summary: 'Reúne a las parejas de animales hacia la rampa del arca y suelta la paloma de la paz.',
    hudDark: false,
    victoryVerse:
      '«Mi arco he puesto en las nubes, el cual será por señal del pacto entre mí y la tierra.»',
    victoryRef: 'Génesis 9:13',
    defeatVerse:
      '«Y lo hizo así Noé; hizo conforme a todo lo que Dios le mandó.»',
    defeatRef: 'Génesis 6:22',
  },
];

export function getStoryMeta(story: StoryId): StoryCatalogItem {
  return STORY_CATALOG.find((s) => s.id === story) ?? STORY_CATALOG[0];
}

export function getNextStoryId(current: StoryId): StoryId {
  const idx = STORY_CATALOG.findIndex((s) => s.id === current);
  if (idx === -1) return STORY_CATALOG[0].id;
  return STORY_CATALOG[(idx + 1) % STORY_CATALOG.length].id;
}
