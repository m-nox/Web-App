
export default function manifest() {
  return {
    name: 'Lini HRIS - Enterprise Edition',
    short_name: 'Lini HRIS',
    description: 'Modern HRIS Web Application with Supabase',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#00AEEF', // Vibrant Linisware Blue
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
