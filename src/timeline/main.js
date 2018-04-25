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

const { ipcRenderer } = require('electron');

window.onload = () => {
  const tweetRendererWrapper = document.getElementById('tweet-renderer-wrapper');
  const tweetRenderer = document.getElementById('tweet-renderer');
  const rendererContext = tweetRenderer.getContext('2d');

  let running = false;
  let alpha = 1.0;
  let shadow = false;

  const resize = () => {
    tweetRenderer.width = tweetRendererWrapper.clientWidth;
    tweetRenderer.height = tweetRendererWrapper.clientHeight;
  };

  const getCanvasHeight = () => tweetRenderer.height;
  const tweetManager = (() => {
    let tweets = [];
    const tweetPassingTime = 60 * 4;
    const commandsToProperty = commands => {
      const property = {
        color: '#fff',
        position: ['naka', 0],
        fontSize: 36
      };
      while (commands.length > 0) {
        const command = commands.pop();
        switch (command) {
          // color
        case 'white':
          property.color = '#fff';
          break;
        case 'red':
          property.color = '#f00';
          break;
        case 'pink':
          property.color = '#ff8080';
          break;
        case 'orange':
          property.color = '#fc0';
          break;
        case 'yellow':
          property.color = '#ff0';
          break;
        case 'green':
          property.color = '#0f0';
          break;
        case 'cyan':
          property.color = '#0ff';
          break;
        case 'blue':
          property.color = '#00f';
          break;
        case 'purple':
          property.color = '#c000ff';
          break;
        case 'black':
          property.color = '#000';
          break;
        case 'niconicowhite':
        case 'white2':
          property.color = '#cc9';
          break;
        case 'truered':
        case 'red2':
          property.color = '#c03';
          break;
        case 'pink2':
          property.color = '#f3c';
          break;
        case 'passionorange':
        case 'orange2':
          property.color = '#f60';
          break;
        case 'madyellow':
        case 'yellow2':
          property.color = '#990';
          break;
        case 'elementalgreen':
        case 'green2':
          property.color = '#0c6';
          break;
        case 'cyan2':
          property.color = '#0cc';
          break;
        case 'marineblue':
        case 'blue2':
          property.color = '#3366ff';
          break;
        case 'nobleviolet':
        case 'purple2':
          property.color = '#63c';
          break;
        case 'black2':
          property.color = '#666';
          break;
          // position
        case 'ue':
          property.position = ['ue', 0];
          break;
        case 'shita':
          property.position = ['shita', getCanvasHeight()];
          break;
        case 'naka':
          property.position = ['naka', 0];
          break;
          // font size
        case 'small':
          property.fontSize = 24;
          break;
        case 'medium':
          property.fontSize = 36;
          break;
        case 'big':
          property.fontSize = 48;
          break;
        default:
          void(0);
        }
      }
      return property;
    };
    const parseTweetText = text => {
      const grammar = /^\[(.*?)\](.+)$/;
      if (grammar.test(text)) {
        const match = text.match(grammar);
        const commands = match[1].split(' ');
        return {
          content: match[2],
          property: commandsToProperty(commands),
          elapsed: 0
        };
      } else {
        return {
          content: text,
          property: commandsToProperty([]),
          elapsed: 0
        };
      }
    };
    return {
      add: status => {
        const parsedTweet = parseTweetText(status ? status.text : '');
        const y = (() => {
          const positionType = parsedTweet.property.position[0];
          const tweetFontSize = parsedTweet.property.fontSize;
          const ranges = tweets
            .filter(t => t.property.position[0] === positionType)
            .map(t => [t.property.position[1], t.property.fontSize])
            .concat(positionType === 'shita' ? [[getCanvasHeight(), 1]] : [[-1, 1]])
            .sort((a, b) => a[0] - b[0]);
          if (positionType === 'shita') {
            while (ranges.length > 1) {
              const downmostTweetRange = ranges.pop();
              const nextTweetRange = ranges[ranges.length - 1];
              if (nextTweetRange[0] + nextTweetRange[1] + tweetFontSize < downmostTweetRange[0]) {
                return downmostTweetRange[0] - tweetFontSize;
              }
            }
            return ranges[0][0] - tweetFontSize;
          } else {
            while (ranges.length > 1) {
              const upmostTweetRange = ranges.shift();
              const nextTweetRange = ranges[0];
              if (upmostTweetRange[0] + upmostTweetRange[1] + tweetFontSize < nextTweetRange[0]) {
                return upmostTweetRange[0] + upmostTweetRange[1];
              }
            }
            return ranges[0][0] + ranges[0][1];
          }
        })();
        parsedTweet.property.position[1] = y;
        tweets.push(parsedTweet);
      },
      draw: ctx => {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.globalAlpha = alpha;
        if (shadow) {
          ctx.shadowColor = 'gray';
          ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = 3;
        } else {
          ctx.shadowColor = 'transparent';
          ctx.shadowOffsetX = ctx.shadowOffsetY = ctx.shadowBlur = 0;
        }
        tweets.forEach(tweet => {
          const content = tweet.content;
          ctx.fillStyle = tweet.property.color;
          ctx.font = `bold ${tweet.property.fontSize}px Arial`;
          const contentMetrics = ctx.measureText(content);
          const x = tweet.property.position[0] === 'naka' ? (ctx.canvas.width + contentMetrics.width / 2) - (ctx.canvas.width + contentMetrics.width) * (tweet.elapsed / tweetPassingTime) :
            ctx.canvas.width / 2;
          ctx.fillText(content, x, tweet.property.position[1]);
        });
      },
      update: () => {
        tweets = tweets.filter(tweet => tweet.elapsed++ < tweetPassingTime);
      }
    };
  })();

  const render = () => {
    rendererContext.clearRect(0, 0, tweetRenderer.width, tweetRenderer.height);
    tweetManager.draw(rendererContext);
    tweetManager.update();
    if (running) {
      window.requestAnimationFrame(render);
    }
  };

  ipcRenderer.on('twitter:start', (ev) => {
    resize();
    running = true;
    render();
  });

  ipcRenderer.on('twitter:status', (ev, twev) => {
    tweetManager.add(twev);
  });

  ipcRenderer.on('twitter:config', (ev, opt) => {
    alpha = opt.alpha;
    shadow = opt.shadow;
  });

  ipcRenderer.on('twitter:transparentize', (ev, transparent) => {
    document.body.style.backgroundColor = transparent ? 'transparent' : 'rgba(0, 0, 0, 0.2)';
  });
};
