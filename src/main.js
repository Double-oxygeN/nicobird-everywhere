/**
 * Copyright 2017 Double_oxygeN
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const url = require('url');
const { loginTwitter, twitter } = require('./twitter.js');

const defaultWindowOpt = {
  width: 480,
  height: 480,
  useContentSize: true,
  show: true,
  resizable: false,
  maximizable: false,
  fullscreenable: false,
  frame: true,
  transparent: false,
  alwaysOnTop: false,
  title: 'nicobird-everywhere',
  webPreferences: {
    devTools: true
  }
};
Object.freeze(defaultWindowOpt);

const createWindowBuilder = opt => {
  let win = null;
  Object.keys(opt.ipcInit).forEach(key => {
    ipcMain.on(key, opt.ipcInit[key].bind(this, () => win));
  });
  return () => {
    if (win === null) {
      win = new BrowserWindow(Object.assign({}, defaultWindowOpt, opt.windowOpt));

      win.loadURL(url.format({
        pathname: path.join(__dirname, opt.path),
        protocol: 'file:',
        slashes: true
      }));
      win.on('closed', () => {
        win = null;
      });
    }
  };
};

const createConfigWindow = createWindowBuilder({
  windowOpt: {
    width: 630,
    height: 420
  },
  path: 'config/index.html',
  ipcInit: {
    'config:twitter-login': (getWindow, ev) => {
      loginTwitter().then(t => {
        t.get('account/verify_credentials', {}, (error, arg, response) => {
          ev.sender.send('login:success', arg.screen_name);
        });
      }).catch(() => {
        ev.sender.send('login:failure');
      });
    },
    'config:twitter-logout': (getWindow, ev) => {
      twitter.logout();
    },
    'config:start': (getWindow, ev, opt) => {
      getWindow().hide();
    },
    'controller:return': (getWindow, ev) => {
      twitter.stopStream();
      getWindow().show();
    }
  }
});
const createTimeLineWindow = createWindowBuilder({
  windowOpt: {
    width: 640,
    height: 360,
    transparent: true,
    frame: false,
    x: 0,
    y: 0
  },
  path: 'timeline/index.html',
  ipcInit: {
    'config:start': (getWindow, _, opt) => {
      createTimeLineWindow();
      getWindow().setContentSize(opt.size.width, opt.size.height);
      getWindow().loadURL(url.format({
        pathname: path.join(__dirname, 'timeline/index.html'),
        protocol: 'file:',
        slashes: true
      }));
      getWindow().webContents.on('did-finish-load', () => {
        getWindow().webContents.send('twitter:config', opt);
        getWindow().webContents.send('twitter:start');
        twitter.stream(opt.endpoint, opt.query, (twev) => {
          getWindow().webContents.send('twitter:status', twev);
        }, (error) => {
          console.error(error.description);
        });
      });
    },
    'controller:return': (getWindow) => {
      getWindow().close();
    },
    'controller:transparentize': (getWindow) => {
      const transparent = getWindow().isAlwaysOnTop();
      getWindow().setAlwaysOnTop(!transparent);
      getWindow().setIgnoreMouseEvents(!transparent);
      getWindow().webContents.send('twitter:transparentize', !transparent);
    }
  }
});
const createControllerWindow = createWindowBuilder({
  windowOpt: {
    width: 640,
    height: 80
  },
  path: 'controller/index.html',
  ipcInit: {
    'config:start': (getWindow, ev, opt) => {
      createControllerWindow();
    },
    'controller:return': (getWindow) => {
      getWindow().close();
    },
    'controller:tweet': (getWindow, _, status) => {
      twitter.tweet(status);
    }
  }
});

app.on('ready', createConfigWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', createConfigWindow);
