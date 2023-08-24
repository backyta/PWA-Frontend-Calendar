import {
    cleanupOutdatedCaches,
    createHandlerBoundToURL,
    precacheAndRoute,
  } from 'workbox-precaching';


  import { clientsClaim } from 'workbox-core';
   
  import { NavigationRoute, registerRoute } from 'workbox-routing';
   
  cleanupOutdatedCaches();
  // self.__WB_MANIFEST is default injection point
  precacheAndRoute(self.__WB_MANIFEST);
   
  // to allow work offline
  registerRoute(
    new NavigationRoute(createHandlerBoundToURL('index.html'), {
      denylist: [/^\/backoffice/],
    })
  );
   
  self.skipWaiting();
  clientsClaim();
   
  self.addEventListener('install', async () => {
    const cache = await caches.open('cache-1');
   
    await cache.addAll([
      //aca lo que se quiere llevar al cache
        'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css',
        '/vite.svg'
    ]);
  });


  const apiOfflineFallbacks = [
    'http://localhost:4000/api/events',
    'http://localhost:4000/api/auth/renew',
    'http://localhost:4173/vite.svg'
  ];

  self.addEventListener('fetch', (event) =>{
    
    if ( !apiOfflineFallbacks.includes(event.request.url) ) return; // toma toda la request del renew

    const resp = fetch( event.request )
    
      .then( response => {
        // en el casi de hacer el fect y el response no viene con data o error o manejado mal en el backend
        // retornamos ...
        if ( !response) {
          return caches.match( event.request );
        }

        // guardar en cahce la respuiesta
        caches.open('cache-dynamic')
        .then( cache => {
          cache.put( event.request, response ); // guardo la req en el cache si alguien ahce esta request responde esto
        });

        return response.clone();
      })
      .catch( err =>{
        console.log('offline response');
        console.log(err);
        return caches.match( event.request );
      });

      event.respondWith(resp); 
  });

  //* el objetivo es retornar una promesa que se ejecuta anajo con el respondeWith