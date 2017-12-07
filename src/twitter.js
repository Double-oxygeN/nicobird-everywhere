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

require('./env.js')();
const OauthTwitter = require('electron-oauth-twitter');
const Twitter = require('twitter');

const oauth = new OauthTwitter({
  key: process.env.TWITTER_CONSUMER_KEY,
  secret: process.env.TWITTER_CONSUMER_SECRET
});

const twitter = (() => {
  let t = null;
  let s = null;
  return {
    _register: _t => {
      return t = _t;
    },
    stream: (endpoint, opt, onData, onError) => {
      if (s !== null) {
        s.destroy();
        s = null;
      }
      if (t !== null) {
        s = t.stream(endpoint, opt);
        s.on('data', onData);
        s.on('error', onError);
      } else {
        console.error('Please login before streaming.');
      }
    },
    stopStream: () => {
      if (s !== null) {
        s.destroy();
        s = null;
      }
    },
    tweet: str => {
      if (t !== null) {
        t.post('statuses/update', { status: str }, (error, tweet, response) => {
          if (!error) {
            console.info(`tweet ${str}`);
          }
        });
      } else {
        console.error('Please login before tweeting.');
      }
    },
    logout: () => {
      if (s !== null) {
        s.destroy();
        s = null;
      }
      t = null;
    }
  };
})();

module.exports = {
  loginTwitter: () => oauth.startRequest({ force_login: true }).then(result => {
    return twitter._register(new Twitter({
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      access_token_key: result.oauth_access_token,
      access_token_secret: result.oauth_access_token_secret
    }))
  }),
  twitter
};
