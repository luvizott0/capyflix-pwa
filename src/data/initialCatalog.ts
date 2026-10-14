import type { MediaItem } from '@/types/media'

export const initialCatalog: MediaItem[] = [
  {
    id: 'cowboy-bebop',
    slug: 'cowboy-bebop',
    tmdbId: 4087,
    title: 'Cowboy Bebop',
    originalTitle: 'カウボーイビバップ',
    type: 'anime',
    poster: 'https://image.tmdb.org/t/p/w780/ccGdB7qLttA1OGFwfz5CY4FQj09.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/f8ioO77KUZu4wYqc30UccaxrGk6.jpg',
    synopsis: 'Spike Spiegel, um rapaz com o passado misterioso e Jet Black, um ex-policial, se unem para ir atrás de criminosos que possuem a cabeça a prêmio, dentro da nave Bebop.',
    genres: ['Ação', 'Aventura', 'Ficção Científica', 'Clássico'],
    year: 1998,
    rating: 8.9,
    isDubbed: true,
    isSubbed: true,
    isFeatured: true,
    seasons: [
      {
        name: 'Dublado',
        episodes: [
          { id: 'cb-dub-1', name: 'Episódio 01 - Asteroid Blues', number: 1, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Dub-1.mp4' },
          { id: 'cb-dub-2', name: 'Episódio 02 - Stray Dog Strut', number: 2, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Dub-2.mp4' },
          { id: 'cb-dub-3', name: 'Episódio 03 - Honky Tonk Women', number: 3, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Dub-3.mp4' },
          { id: 'cb-dub-4', name: 'Episódio 04 - Gateway Shuffle', number: 4, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Dub-4.mp4' },
          { id: 'cb-dub-5', name: 'Episódio 05 - Ballad of Fallen Angels', number: 5, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Dub-5.mp4' },
          { id: 'cb-dub-6', name: 'Episódio 06 - Sympathy for the Devil', number: 6, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Dub-6.mp4' }
        ]
      },
      {
        name: 'Legendado',
        episodes: [
          { id: 'cb-leg-1', name: 'Episódio 01 - Asteroid Blues', number: 1, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Leg-1.mp4' },
          { id: 'cb-leg-2', name: 'Episódio 02 - Stray Dog Strut', number: 2, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Leg-2.mp4' },
          { id: 'cb-leg-3', name: 'Episódio 03 - Honky Tonk Women', number: 3, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Leg-3.mp4' }
        ]
      },
      {
        name: 'Filme',
        episodes: [
          { id: 'cb-movie-dub', name: 'O Filme: Knocking On Heavens Door (DUB)', number: 1, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Filme-Dub.mp4' },
          { id: 'cb-movie-leg', name: 'O Filme: Knocking On Heavens Door (LEG)', number: 2, streamUrl: 'https://ia803106.us.archive.org/26/items/CowboyDubLeg/Filme-Leg.mp4' }
        ]
      }
    ]
  },
  {
    id: 'nokotan',
    slug: 'nokotan',
    tmdbId: 249581,
    title: 'Minha Amiga Nokotan é um Cervo',
    originalTitle: 'しかのこのconocoしたんたん',
    type: 'anime',
    poster: 'https://image.tmdb.org/t/p/w780/qxuxdQuIf8RqXmBNNaeteXgiMVf.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/bFxcYS5YqksYjb4ANBDxZi7wdS4.jpg',
    synopsis: 'Torako Koshi é uma aluna exemplar do ensino médio que encontra uma garota da sua idade presa nos postes de energia por causa de seus... Chifres? A vida dessa ex-delinquente vira de cabeça pra baixo agora que sua amiga-cervo, Shikanoko, chegou para ficar.',
    genres: ['Comédia', 'Ficção', 'Fantasia', 'Escolar'],
    year: 2024,
    rating: 8.6,
    isDubbed: true,
    isSubbed: true,
    isNew: true,
    isFeatured: true,
    seasons: [
      {
        name: 'Dublado',
        episodes: [
          { id: 'noko-dub-1', name: 'Episódio 01 - Garota Encontra Cervo', number: 1, streamUrl: 'https://ia600102.us.archive.org/12/items/NokotanDubLeg/Dub-1.mp4' },
          { id: 'noko-dub-2', name: 'Episódio 02 - O Clube dos Cervos', number: 2, streamUrl: 'https://ia600102.us.archive.org/12/items/NokotanDubLeg/Dub-2.mp4' },
          { id: 'noko-dub-3', name: 'Episódio 03 - A Nova Integrante', number: 3, streamUrl: 'https://ia600102.us.archive.org/12/items/NokotanDubLeg/Dub-3.mp4' },
          { id: 'noko-dub-4', name: 'Episódio 04 - O Segredo dos Chifres', number: 4, streamUrl: 'https://ia600102.us.archive.org/12/items/NokotanDubLeg/Dub-4.mp4' }
        ]
      },
      {
        name: 'Legendado',
        episodes: [
          { id: 'noko-leg-1', name: 'Episódio 01 - Garota Encontra Cervo', number: 1, streamUrl: 'https://ia600102.us.archive.org/12/items/NokotanDubLeg/Leg-1.mp4' },
          { id: 'noko-leg-2', name: 'Episódio 02 - O Clube dos Cervos', number: 2, streamUrl: 'https://ia600102.us.archive.org/12/items/NokotanDubLeg/Leg-2.mp4' }
        ]
      }
    ]
  },
  {
    id: 'clannad',
    slug: 'clannad',
    tmdbId: 20604,
    title: 'Clannad',
    originalTitle: 'CLANNAD -クラナド-',
    type: 'anime',
    poster: 'https://image.tmdb.org/t/p/w780/jPBMYp4ddXkGJDSxxmaKBjzv2r3.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/h9nAWM6TF59g39l3fDzqTgW7ap2.jpg',
    synopsis: 'Tomoya é um estudante amargurado do terceiro ano. A caminho da escola, ele conhece Nagisa Furukawa, que está repetindo a série. Os dois começam a sair juntos e percebem suas vidas tomando um novo rumo.',
    genres: ['Drama', 'Romance', 'Comédia', 'Emocional'],
    year: 2007,
    rating: 8.8,
    isDubbed: false,
    isSubbed: true,
    isFeatured: true,
    seasons: [
      {
        name: 'Legendado',
        episodes: [
          { id: 'clannad-1', name: 'Episódio 01 - Na Colina Onde as Folhas de Cerejeira Caem', number: 1, streamUrl: 'https://ia903102.us.archive.org/4/items/ClannadLeg/1.mp4' },
          { id: 'clannad-2', name: 'Episódio 02 - O Primeiro Passo', number: 1, streamUrl: 'https://ia903102.us.archive.org/4/items/ClannadLeg/2.mp4' },
          { id: 'clannad-3', name: 'Episódio 03 - Mais Uma Vez Depois de Chorar', number: 3, streamUrl: 'https://ia903102.us.archive.org/4/items/ClannadLeg/3.mp4' }
        ]
      }
    ]
  },
  {
    id: 'date-a-live',
    slug: 'date-a-live',
    tmdbId: 48443,
    title: 'Date A Live',
    originalTitle: 'デート・ア・ライブ',
    type: 'anime',
    poster: 'https://image.tmdb.org/t/p/w780/xEwKIg7m8TzjFTY5T4Yj3beR7rH.jpg',
    backdrop: 'https://image.tmdb.org/t/p/original/5Qb4h22gfDuCINm6nrn3HiPSgQZ.jpg',
    synopsis: 'Incessantes terremotos assolam a Terra provocados por seres mágicos chamados Espíritos. Shido Itsuka descobre que tem o poder único de selar seus poderes fazendo-os se apaixonar.',
    genres: ['Ação', 'Comédia', 'Ficção Científica', 'Romance'],
    year: 2013,
    rating: 8.4,
    isDubbed: true,
    isSubbed: true,
    isFeatured: true,
    seasons: [
      {
        name: '1ª Temporada',
        episodes: [
          { id: 'dal-s1-e1', name: 'Episódio 01 - Encontro Marcado', number: 1, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Primeira-1.mp4' },
          { id: 'dal-s1-e2', name: 'Episódio 02 - Espada Furiosa', number: 2, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Primeira-2.mp4' },
          { id: 'dal-s1-e3', name: 'Episódio 03 - Chuva de Outubro', number: 3, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Primeira-3.mp4' },
          { id: 'dal-s1-e4', name: 'Episódio 04 - O Retorno da Calamidade', number: 4, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Primeira-4.mp4' },
          { id: 'dal-s1-e5', name: 'Episódio 05 - O Chão Gelado', number: 5, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Primeira-5.mp4' }
        ]
      },
      {
        name: '2ª Temporada (Dublada)',
        episodes: [
          { id: 'dal-s2-e1', name: 'Episódio 01 - Tempestade Diária', number: 1, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Segunda-Dub-1.mp4' },
          { id: 'dal-s2-e2', name: 'Episódio 02 - Filhos das Trevas', number: 2, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Segunda-Dub-2.mp4' },
          { id: 'dal-s2-e3', name: 'Episódio 03 - O Som da Alma', number: 3, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Segunda-Dub-3.mp4' }
        ]
      },
      {
        name: 'Filme',
        episodes: [
          { id: 'dal-film', name: 'Mayuri Judgement', number: 1, streamUrl: 'https://ia600707.us.archive.org/7/items/DateLive/Filme.mp4' }
        ]
      }
    ]
  }
]
