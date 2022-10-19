
const ROOT_PATH = "/practica7";
const STATIC_CACHE_NAME = 'static-cache-v1.0';
const INMUTABLE_CACHE_NAME = 'inmutable-cache-v1.0';
const DYNAMIC_CACHE_NAME = 'dynamic-cache-v1.0';
const LIMIT_ELEMENTS = 20;

const ELEMENTS_CACHE = {
    [STATIC_CACHE_NAME]: [
        `${ROOT_PATH}/`, 
        `${ROOT_PATH}/index.html`,
        `${ROOT_PATH}/images/icons/android-launchericon-48-48.png`,
        `${ROOT_PATH}/images/icons/android-launchericon-72-72.png`,
        `${ROOT_PATH}/images/icons/android-launchericon-96-96.png`,
        `${ROOT_PATH}/images/icons/android-launchericon-144-144.png`,
        `${ROOT_PATH}/images/icons/android-launchericon-192-192.png`,
        `${ROOT_PATH}/images/icons/android-launchericon-512-512.png`,
    ],
    [INMUTABLE_CACHE_NAME]: [
        // Los archivos de Bootstrap pueden ser actualizados debido a su versión, se dice que son archivos inmutables.
        `https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/css/bootstrap.min.css`,
        `https://cdn.jsdelivr.net/npm/bootstrap@5.2.2/dist/js/bootstrap.bundle.min.js`,
        `https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css`,
    ],
};

self.addEventListener('install', event => {
    const PROMISES = Object.keys(ELEMENTS_CACHE).map((cacheName) => {
        return caches.open(cacheName)
            .then((cache) => {
                return cache.addAll(ELEMENTS_CACHE[cacheName]);
            });
    });
    
    event.waitUntil(Promise.all(PROMISES));
});

// Estrategía Cache With Network fallback
self.addEventListener('fetch', (event) => {
    let respFetch;

    if (existsElementInAppShell(event.request.url)) {
        respFetch = onlyCache(event.request);
    } else {
        respFetch = getResponseNetwork(event.request); 
    }

    return event.respondWith(respFetch);
});

// Verifica si un elemento existe en el arreglo de elementos en cache
function existsElementInAppShell(element) {
    for (const elements of Object.values(ELEMENTS_CACHE))
        if (elements.includes(element)) 
            return true;
    return false;
}

// Retorna el elemento en cache
function onlyCache(req) {
    return caches.match(req);
}

// Ve al network y consulta todos los recursos
function getResponseNetwork(req) {
    return fetch(req).then((respWeb) => {
        // En caso de que no exista una respuesta, entonces bucamos en cache 
        if (!respWeb)
            return onlyCache(req);

        caches.open(DYNAMIC_CACHE_NAME).then(async (cache) => {
            await cache.put(req, respWeb);
            cleanCache(DYNAMIC_CACHE_NAME, LIMIT_ELEMENTS);
        });
        return respWeb.clone();
    }).catch(() => {
        return onlyCache(req);
    });
}

// Ayuda a eliminar elementos poniendo un número límite de objetos a guardar
function cleanCache (cacheName, numberItems) {
    return caches.open(cacheName).then((cache) => {
        cache.keys().then((keys) => {
            console.log('SW:', keys);
            if (keys.length > numberItems) {
                cache.delete(keys[0]).then(cleanCache(cacheName, numberItems));
            }
        })
    });
}