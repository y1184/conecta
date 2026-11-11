import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const urlBase = 'https://conecta.uy' // (Cuando tengas el dominio real, cambialo acá)

  return [
    {
      url: urlBase,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${urlBase}/trabajos`,
      lastModified: new Date(),
      changeFrequency: 'hourly', // Las demandas cambian todo el tiempo
      priority: 0.9,
    },
    {
      url: `${urlBase}/trabajadores`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${urlBase}/publicar`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${urlBase}/formalizate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ]
}
