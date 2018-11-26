'use strict';

(function ($) {


    const storageKey = 'kappa-js';
    const channelsStorageKey = 'kappa-js-pc';
    const template = {
        small: "https://static-cdn.jtvnw.net/emoticons/v1/{image_id}/1.0",
        medium: "https://static-cdn.jtvnw.net/emoticons/v1/{image_id}/2.0",
        large: "https://static-cdn.jtvnw.net/emoticons/v1/{image_id}/3.0",
        smile: "https://static-cdn.jtvnw.net/jtv_user_pictures/chansub-global-emoticon-{image_id}-24x18.png"
    };

    var emoteList = null;
    var previousChannels = null;
    //var twitchEmotesRegExp = null;

    var _busy = false;

    /**
     * Initialize jQuery Plugin
     * @return {this} DOM element
     */
    $.fn.kappa = async function (settings) {

        /**
         * Hoist `this`
         * Needed if KappaJS is not ready
         */
        var self = this;

        /**
         * Define default plugin configuration
         * @param  {String} {action} Action to perform (replace/refresh)
         * @param  {String} {emoteSize} Template size for emotes
         * @param  {String} {customClass} Custom class to added to generatated <img> tags
         * @param  {Array} {channel} Array with channel names for subscriber emotes
         * @param  {Function} {completeCallback} Function to call after completing refreshing emotes
         */
        var config = $.extend({
            action: 'replace',
            emoteSize: 'small',
            customClass: null,
            channels: null,
            refreshCompleteCallback: null
        }, settings);

        switch (config.action) {
            case 'replace':
                await replaceEmotes();
                break;
            case 'replaceIfReady':
                replaceEmotesIfReady();
                break;
            case 'refresh':
                refreshEmotes();
                break;
            default:
                console.error('Unknown parameter \'action\': ' + config.action);
                return this;
        }

        /**
         * Loads emote list from storage or downloads it from web if there is no saved list.
         * @returns {Promise<void>}
         */
        async function init() {
            if (_busy)
                return;

            try {
                _busy = true;
                let data = await loadChromeStorage([storageKey, channelsStorageKey]);
                emoteList = data[storageKey];
                previousChannels = data[channelsStorageKey];
                if (emoteList == null || previousChannels == null || !arrayCompare(previousChannels, config.channels)) {
                    emoteList = null;
                    //twitchEmotesRegExp = null;
                    emoteList = await getTwitchEmotes();
                }
                previousChannels = config.channels;
                //twitchEmotesRegExp = generateEmoteRegExp(emoteList);
            } catch (e) {
                console.error(e);
                emoteList = null;
                //twitchEmotesRegExp = null;
            }

            _busy = false;
        }

        /**
         * Loads data from chrome.storage.local
         * @param {Array} keys
         * @returns {Promise<*>}
         */
        async function loadChromeStorage(keys) {
            function _load() {
                let deferred = $.Deferred();
                chrome.storage.local.get(keys, function (data) {
                    deferred.resolve(data);
                });
                return deferred.promise();
            }

            let data = await _load();
            if (data) {
                return data;
            }
            return null;
        }

        /**
         * Saves data to chrome.storage.local
         * @param data
         */
        function saveChromeStorage(data) {
            chrome.storage.local.set(data, null);
        }

        /**
         * Get global.json and subscribers.json from TwitchEmotes API and form a union result
         * @returns {Promise<void>} List of emotes
         */
        async function getTwitchEmotes() {
            let newEmotes = {};
            let allGetPromises = [];


            allGetPromises.push(
                $.get('https://twitchemotes.com/api_cache/v3/global.json', function (data) {
                    for (var emoteName in data) {
                        newEmotes[emoteName] = data[emoteName].id;
                    }
                })
            );

            allGetPromises.push(
                new Promise(async function (resolve, reject) {
                    let smilies = await loadJson("../json/smilies.json");
                    for (let smile in smilies) {
                        newEmotes[smile] = smilies[smile];
                    }
                    resolve();
                })
            );

            if (config.channels != null) {
                allGetPromises.push(
                    // $.get('https://twitchemotes.com/api_cache/v3/subscriber.json', function (data) {
                    //     //process sub emotes and add to list
                    //     var channelCount = config.channels.length;
                    //     var foundChannelCount = 0;
                    //     for (var channelId in data) {
                    //         if (foundChannelCount >= channelCount)
                    //             break;
                    //         if (config.channels.some(ch => {return ch.toLowerCase() == data[channelId].channel_name})) {
                    //             // test if enters here
                    //             data[channelId].emotes.forEach(elem => {newEmotes[elem.code] = elem.id});
                    //
                    //         }
                    //     }
                    // })

                    new Promise(async function (resolve, reject) {
                        let subscribers = await loadJson("../json/subscribers.json");
                        let channelCount = config.channels.length;
                        let foundChannelCount = 0;
                        for (let channel in subscribers) {
                            if (foundChannelCount >= channelCount)
                                break;
                            if (config.channels.some(ch => {return ch.toLowerCase() == channel})) {
                                for (let emote in subscribers[channel])
                                {
                                    newEmotes[emote] = subscribers[channel][emote];
                                }
                                foundChannelCount++;
                            }
                        }
                        resolve();
                    })


                )
            }

            await Promise.all(allGetPromises);

            let storageData = {};
            storageData[storageKey] = newEmotes;
            storageData[channelsStorageKey] = config.channels;
            saveChromeStorage(storageData);
            return newEmotes;
        }

        /**
         * Generates <img> tag
         * @param id Emote ID
         * @param name
         * @returns {string}
         */
        function generateImgTag(id, name) {
            let _template;
            if (typeof id == "string")
                _template = template.smile;
            else
                _template = template[config.emoteSize];
            return ['<img src="',
                _template.replace('{image_id}', id), '" ',
                config.customClass === null ? '' : 'class="' + config.customClass + '" ',
                'alt="', name, '">'].join('');
        }

        /**
         * Loop through all emoteSize
         * Find known emotes using RegExp
         * Replace with generated <img> tag
         */
        // function replaceTextWithEmotes() {
        //     if (twitchEmotesRegExp == null)
        //         twitchEmotesRegExp = generateEmoteRegExp(emoteList);
        //     $(self).each(function (i, el) {
        //         $(el).html($(el).html().replace(twitchEmotesRegExp, function (all, emote) {
        //             return generateImgTag(emoteList[escapeRegExp(emote)], emote);
        //         }));
        //     });
        // }

        function replaceTextWithEmotes() {
            $(self).each(function (i, el) {

                let text = $(el).html();
                // let pos = 0;
                // let copyPos = 0;
                // let foundResults = [];
                // while (text.length > pos + 1) {
                //     let isFound = false;
                //     for (let i in emoteList) {
                //         let n = text.indexOf(i, pos);
                //         let emoteLength = i.length;
                //         if ((n >= 0) && (n === 0 || text.charAt(n - 1) === ' ') && ((text.length === n + emoteLength) || (text.length > n + emoteLength) && (text.charAt(n + emoteLength) === ' '))) {
                //             pos = n + emoteLength;
                //             isFound = true;
                //             copyPos = n - 1;
                //             foundResults.push(i);
                //             break;
                //         }
                //     }
                //     if (!isFound)
                //         break;
                // }

                let isFound = false;
                for (let e in emoteList) {
                    let searchStartPos = 0;
                    do {
                        isFound = false;
                        let n = text.indexOf(e, searchStartPos);
                        if (n >= 0) {
                            isFound = true;
                            let emoteLength = e.length;
                            if ((n === 0 || text.charAt(n - 1) === ' ') && ((text.length === n + emoteLength) || (text.length > n + emoteLength) && (text.charAt(n + emoteLength) === ' '))) {
                                let imgTag = generateImgTag(emoteList[e], e);
                                text = text.substring(0, n) + imgTag + text.substring(n + emoteLength);
                                searchStartPos = n + imgTag.length;
                            } else {
                                searchStartPos = n + emoteLength;
                            }
                        }
                    } while (isFound);
                }

                // let newText = $(el).html();
                // for (let m in foundResults) {
                //     newText.replace(m, generateImgTag(emoteList[foundResults.m], foundResults.m));
                // }

                $(el).html(text);

            });

        }

        /**
         * Generates regular expression for emote code lookup.
         * @param el Emote list
         * @returns {RegExp}
         */
        // function generateEmoteRegExp(el) {
        //     //return new RegExp("\\b(" + Object.keys(el).join("|") + ")\\b", "g");
        //     return new RegExp("(?:^|\\s)(" + Object.keys(el).join("|") + ")(?:$|\\s)", "g");
        // }

        // function escapeRegExp(text) {
        //     return text.replace(/[-[\]:;<{}()*+?.,\\^$|#\s]/g, '\\$&');
        // }

        /**
         * Replaces all found emote codes with their images.
         * @returns {Promise<void>}
         */
        async function replaceEmotes() {
            await init();
            replaceTextWithEmotes();
            //runWhenReady(replaceTextWithEmotes);
        }

        /**
         * Replaces all found emote codes with their images
         * @returns {Promise<void>}
         */
        async function replaceEmotesIfReady() {
            runIfReady(replaceTextWithEmotes());
        }

        /**
         * Downloads all emote descriptions and forms a list. May be slow for subscriber emotes.
         * @returns {Promise<void>}
         */
        async function refreshEmotes() {
            if (_busy)
                return;

            try {
                _busy = true;
                emoteList = null;
                //twitchEmotesRegExp = null;
                emoteList = await getTwitchEmotes();
                previousChannels = config.channels;
               //twitchEmotesRegExp = generateEmoteRegExp(emoteList);
            } catch(e) {
                console.error(e);
            } finally {
                _busy = false;
                if (config.refreshCompleteCallback != null)
                    config.refreshCompleteCallback();
            }
        }

        /**
         * Waits for emote list to be ready and then runs the function
         * @param func Function to run
         */
        function runWhenReady(func) {
            if (isReady()) {
                func();
            } else {
                let _watch = setInterval(function () {
                    if (emoteList != null && twitchEmotesRegExp != null) {
                        func();
                        clearInterval(_watch);
                    }
                }, 200);
            }
        }

        /**
         * Runs function only if emote list is ready
         * @param func Function to run
         */
        function runIfReady(func) {
            if (isReady()) {
                func();
            } else {
                setTimeout(function () {
                    if (isReady())
                        func();
                }, 100);
            }
        }

        function isReady() {
            return !_busy && emoteList != null && twitchEmotesRegExp != null;
        }

        function arrayCompare(arr1, arr2) {
            if (!arr1 || !arr2)
                return false;

            if (arr1.length != arr2.length)
                return false;

            for (let i = 0, l=arr1.length; i < l; i++) {
                // Check if we have nested arrays
                if (arr1[i] instanceof Array && arr2[i] instanceof Array) {
                    // recurse into the nested arrays
                    if (!arrayCompare(arr1[i],arr2[i]))
                        return false;
                }
                else if (arr1[i] != arr2[i]) {
                    // Warning - two different object instances will never be equal: {x:20} != {x:20}
                    return false;
                }
            }
            return true;
        }

        async function loadJson(filename) {
            try {
                let url = chrome.extension.getURL(filename);
                return await $.get(url);
            }
            catch (err) {
                pj.LogError("Error: " + err)
            }
        }


    };
})(jQuery);