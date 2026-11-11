import { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
  const urlBase = 'https://conecta.uy' // (Acordate de cambiarlo cuando tengas el dominio)

  return {
    rules: {
      userAgent: '*',
      allow: '/', // Permitir todo lo público...
      disallow: [ // ...excepto estas páginas privadas
        '/perfil', 
        '/perfil/editar',
        '/perfil/guardados',
        '/chat', 
        '/mensajes', 
        '/login', 
        '/registro',
        '/recuperar',
        '/nueva-password'
      ],
    },
    sitemap: `${urlBase}/sitemap.xml`, // Le avisamos a Google dónde está el mapa
  }
}
