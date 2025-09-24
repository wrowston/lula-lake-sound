import { supabase } from './supabase'

export interface StudioImage {
  name: string
  url: string
  id: string
}

export async function getStudioImages(bucketName: string = 'studio-gallery'): Promise<StudioImage[]> {
  try {
    const knownImageNames = [
      'recordingstudio-2.jpg',
      'recordingstudio-6.jpg',
      'recordingstudio-9.jpg',
      'recordingstudio-10.jpg',
      'recordingstudio-11.jpg',
      'recordingstudio-14.jpg',
      'recordingstudio-12.jpg',
      'recordingstudio-15.jpg',
      'recordingstudio-26.jpg'
    ]

    const imagesWithUrls = knownImageNames.map(filename => {
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filename)

      return {
        name: filename,
        url: urlData.publicUrl,
        id: filename
      }
    })

    return imagesWithUrls

  } catch (error) {
    console.error('Error fetching studio images:', error)
    return []
  }
}