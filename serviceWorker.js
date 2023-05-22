/* serviceWorker.js */
// (参考) https://developer.mozilla.org/ja/docs/Web/Progressive_web_apps/Offline_Service_workers
'use strict';

const cacheName = 'bgKifuInputTool-v20230522';
const ORIGIN = (location.hostname == 'localhost') ? '' : location.protocol + '//' + location.hostname;

const contentToCache = [
  ORIGIN + '/bgKifuInputTool/',
  ORIGIN + '/bgKifuInputTool/index.html',
  ORIGIN + '/bgKifuInputTool/help.html',
  ORIGIN + '/bgKifuInputTool/manifest.json',
  ORIGIN + '/bgKifuInputTool/icon/favicon.ico',
  ORIGIN + '/bgKifuInputTool/icon/apple-touch-icon.png',
  ORIGIN + '/bgKifuInputTool/icon/android-chrome-96x96.png',
  ORIGIN + '/bgKifuInputTool/icon/android-chrome-192x192.png',
  ORIGIN + '/bgKifuInputTool/icon/android-chrome-512x512.png',
  ORIGIN + '/bgKifuInputTool/css/KifuInputTool.css',
  ORIGIN + '/bgKifuInputTool/js/KifuInputTool_class.js',
  ORIGIN + '/bgKifuInputTool/js/BgKifu_class.js',
  ORIGIN + '/bgKifuInputTool/js/BgKfInputBoard_class.js',
  ORIGIN + '/css/font-awesome-animation.min.css',
  ORIGIN + '/css/bgBoard.css',
  ORIGIN + '/css/FloatWindow2.css',
  ORIGIN + '/js/fontawesome-inuse.min.js',
  ORIGIN + '/js/jquery-3.6.1.min.js',
  ORIGIN + '/js/FloatWindow3.js',
  ORIGIN + '/js/BgChequer_class.js',
  ORIGIN + '/js/BgXgid_class.js',
  ORIGIN + '/js/BgUtil_class.js',
  ORIGIN + ''
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(contentToCache);
    })
  );
});
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).then((response) => {
        return caches.open(cacheName).then((cache) => {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        const [kyappname, kyversion] = key.split('-');
        const [cnappname, cnversion] = cacheName.split('-');
        if (kyappname === cnappname && kyversion !== cnversion) {
          return caches.delete(key);
        }
      }));
    })
  );
});
