export interface Track {
  id: number;
  title: string;
  url: string;
  cover: string;
  lyrics?: string;
}

export interface Video {
  id: string;
  title: string;
  youtubeId: string;
}

export interface SocialLinks {
  instagram?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
}

export interface Artist {
  slug: string;
  name: string;
  bio: string;
  fullBio: string;
  cover: string;
  tracks: Track[];
  videos: Video[];
  social: SocialLinks;
}

export const artists: Artist[] = [
  //  ARTISTA 1: Herencia González Bs.
  {
    slug: 'herencia-gonzalez',
    name: 'Herencia González Bs.',
    bio: 'Grupo regional con un estilo único. Escanea tu chip NFC para acceder a nuestro contenido exclusivo.',
    fullBio: `Herencia González Bs. es un grupo musical que nació con la pasión de llevar la música regional a nuevos horizontes. Con un estilo que mezcla la tradición con sonidos modernos, han logrado conectar con audiencias de todas las edades.

Su trayectoria comenzó en pequeños escenarios locales, pero gracias a su dedicación y talento, han logrado consolidarse como una propuesta fresca en la música regional. Cada canción es una historia, cada presentación es una experiencia.`,
    cover: '/images/julian.jpg',
    tracks: [
      {
        id: 1,
        title: "Julián Maldonado",
        url: "/music/julian maldonado - preview.wav",
        cover: "/images/julian.jpg",
        lyrics: `Julián Maldonado, nombre que lleva el viento,
en cada esquina se escucha tu acento.
Con la guitarra en la mano y el alma en la voz,
cuentas historias que tocan a los dos.

(Coro)
Julián, Julián, leyenda del lugar,
con tus canciones nos haces soñar.`
      },
      {
        id: 2,
        title: "Te Elegí",
        url: "/music/Te Elegi - Herencia Gonzales BS Pord. Fkris.wav",
        cover: "/images/teelegi.jpg",
        lyrics: `Entre tantas almas, entre tantos caminos,
te encontré a ti, mi mejor destino.
No fue casualidad, fue el corazón,
el que te eligió como mi razón.

(Coro)
Te elegí a ti, entre mil,
te elegí a ti, mi perfil.`
      }
    ],
    videos: [
      { id: '1', title: 'Julián Maldonado - Video Oficial', youtubeId: 'dQw4w9WgXcQ' },
      { id: '2', title: 'Te Elegí - En Vivo', youtubeId: 'dQw4w9WgXcQ' }
    ],
    social: {
      instagram: 'https://instagram.com',
      tiktok: 'https://tiktok.com',
      facebook: 'https://facebook.com',
      youtube: 'https://youtube.com'
    }
  },

  // 🎤 ARTISTA 2: Los Rebeldes del Norte (Ejemplo)
  {
    slug: 'los-rebeldes-del-norte',
    name: 'Los Rebeldes del Norte',
    bio: 'La nueva ola del norte. Corridos tumbados y sierreño con actitud.',
    fullBio: `Los Rebeldes del Norte surgieron en las calles del norte de México, trayendo una propuesta fresca que mezcla el sierreño tradicional con el trap y el corrido tumbado. 

Con letras que narran la vida real y un estilo inconfundible, se han ganado el respeto de la nueva generación. Su música es para los que no se rinden y viven al límite.`,
    cover: '/images/julian.jpg', // Usamos la misma imagen de prueba por ahora
    tracks: [
      {
        id: 1,
        title: "El Rebelde",
        url: "/music/julian maldonado - preview.wav", // Usamos el mismo audio de prueba
        cover: "/images/julian.jpg",
        lyrics: `Caminando por la calle, con la frente en alto,
no le temo a la vida, ni le tengo un fallo.
Soy rebelde de nacimiento, así me crió mi viejo,
y si el mundo se me pone en contra, yo le doy un reflejo.`
      }
    ],
    videos: [
      { id: '1', title: 'El Rebelde - Lyric Video', youtubeId: 'dQw4w9WgXcQ' }
    ],
    social: {
      instagram: 'https://instagram.com',
      tiktok: 'https://tiktok.com',
      facebook: 'https://facebook.com',
      youtube: 'https://youtube.com'
    }
  },

  // 🎤 ARTISTA 3: Valeria Luna (Ejemplo Femenino)
  {
    slug: 'valeria-luna',
    name: 'Valeria Luna',
    bio: 'La voz femenina que está rompiendo esquemas en la música regional.',
    fullBio: `Valeria Luna es una cantante y compositora que está revolucionando la escena regional mexicana. Con una voz potente y letras que tocan el alma, Valeria se ha convertido en la favorita de miles de fans.

Su estilo mezcla la ranchera clásica con toques de pop, creando himnos que se cantan a todo pulmón en cada concierto.`,
    cover: '/images/teelegi.jpg', // Usamos la otra imagen de prueba
    tracks: [
      {
        id: 1,
        title: "Luna Llena",
        url: "/music/Te Elegi - Herencia Gonzales BS Pord. Fkris.wav", // Audio de prueba
        cover: "/images/teelegi.jpg",
        lyrics: `Bajo la luna llena, te juré mi amor,
que no habría distancia, ni ningún dolor.
Y aquí sigo esperando, bajo este cielo gris,
que vuelvas a mi vida, y me hagas feliz.`
      }
    ],
    videos: [
      { id: '1', title: 'Luna Llena - Video Oficial', youtubeId: 'dQw4w9WgXcQ' }
    ],
    social: {
      instagram: 'https://instagram.com',
      tiktok: 'https://tiktok.com',
      facebook: 'https://facebook.com',
      youtube: 'https://youtube.com'
    }
  }
];

export function getArtistBySlug(slug: string) {
  return artists.find(artist => artist.slug === slug);
}

export function getAllArtists() {
  return artists;
}