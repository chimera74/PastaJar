pj.Settings.storageKey = "PJSettings";

pj.Settings.keys = {
    PJ_SETTING_POS_X: "posX",
    PJ_SETTING_POS_Y: "posY",
    PJ_SETTING_HEIGHT: "height",
    PJ_SETTING_WIDTH: "width",

    PJ_SETTING_LOAD_EMOTES: "pj_setting_load_emotes",
    PJ_SETTING_LOAD_BTTV_EMOTES: "pj_setting_load_bttv_emotes",
    PJ_SETTING_LOAD_FFZ_EMOTES: "pj_setting_load_ffz_emotes",

    PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST: "pj_settings_channels"
};


pj.Settings.Init = function () {

    /*
    Building a form for settings
     */
    pj.Settings.settingsContainer = $('#pj-settings-container');
    pj.Settings.settingsContainer.append(pj.Settings.getCheckSettingHtml(pj.Settings.keys.PJ_SETTING_LOAD_EMOTES,
        pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES],
        'Load emote images',
        "Check to show emote images in storage and in preview while editing.",
        false,
        true));
    pj.Settings.attachCheckboxHandlers(pj.Settings.keys.PJ_SETTING_LOAD_EMOTES);

    pj.Settings.settingsContainer.append(pj.Settings.getCheckSettingHtml(pj.Settings.keys.PJ_SETTING_LOAD_BTTV_EMOTES,
        pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_BTTV_EMOTES],
        'Load BTTV emotes',
        "(Not implemented) Check to also show BTTV emotes.",
        true,
        false));
    pj.Settings.attachCheckboxHandlers(pj.Settings.keys.PJ_SETTING_LOAD_BTTV_EMOTES);

    pj.Settings.settingsContainer.append(pj.Settings.getCheckSettingHtml(pj.Settings.keys.PJ_SETTING_LOAD_FFZ_EMOTES,
        pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_FFZ_EMOTES],
        'Load FFZ emotes',
        "(Not implemented) Check to also show FFZ emotes.",
        true,
        false));
    pj.Settings.attachCheckboxHandlers(pj.Settings.keys.PJ_SETTING_LOAD_FFZ_EMOTES);


    // Label
    pj.Settings.settingsContainer.append("<div class='pj-setting-subsequent'>" +
        "Channels: <br>" +
        "<input id='" + pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST + "'" +
        " title='List of comma separated channel names which subscriber emotes to show'" +
        " type=\"text\"> <br>" +
        "</div>");

    // Input
    pj.Settings.channelsInput = $("input#" + pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST);
    pj.Settings.channelsInput.val(pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST].join());
    pj.Settings.channelsInput.on('input',function(e) {
        pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST] = pj.Settings.parseChannelList($("input#" + pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST).val());
        pj.Settings.SaveSettings();
    });

    // refresh button and progressbar
    pj.Settings.settingsContainer.append("<div class='pj-setting-subsequent'>" +
        "<button id='pj-reload-emotes-button'>Reload emotes</button>" +
        "<div id='pj-reload-emotes-progressbar'></div>" +
        "</div>");
    let _button = $("button#pj-reload-emotes-button");
    let _pbar = $("#pj-reload-emotes-progressbar");
    _pbar.progressbar({
        value: false
    });
    _pbar.hide();
    _button.button().click(()=>{
        _button.hide();
        _pbar.show();

        $().kappa({
            action: 'refresh',
            channels: pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST],
            refreshCompleteCallback: () => {
                _button.show();
                _pbar.hide();
            }
        })
        pj.Log("refresh end")
        }
    );


    pj.settingsFrame.find($("#pj-settings-back-button")).click(function () {
        pj.Settings.Close();
    });

};

pj.Settings.Close = function() {
    pj.Storage.RefreshContainer();
    pj.ShowStorage();
};

pj.Settings.getCheckSettingHtml = function (id, isChecked, text, hint, isSubsequent, isEnabled) {
    return "" +
        "<div class='pj-checkbox-container" + (isSubsequent ? " pj-setting-subsequent" : "") + "'>" +
        "<input id='" + id + "' type='checkbox' " +
        (isChecked ? "checked " : "") +
        "title='" + hint + "'" +
        (isEnabled ? "" : " disabled") + ">" +
        "<label>" + text + "</label>" +
        "</div>";
};

pj.Settings.attachCheckboxHandlers = function (id) {
    $('#' + id).click(function () {
        pj.Settings.settings[id] = $('#' + id).is(":checked");
        pj.Settings.SaveSettings();
    });
};

/**
 * Parses string of comma separated channel names into array of strings
 * @param str
 * @returns {string[]}
 */
pj.Settings.parseChannelList = function (str) {
    return str.trim().replace(/\s+/g, '').split(',');
};


pj.Settings.SaveSettings = function () {
    // save to storage
    chrome.storage.local.set({[pj.Settings.storageKey]: pj.Settings.settings}, function () {
        pj.Log("Settings saved to local storage");
    });
};

pj.Settings.LoadSettings = async function () {

    function _loadSettings() {
        let deferred = $.Deferred();
        chrome.storage.local.get([pj.Settings.storageKey], function (data) {
            deferred.resolve(data);
        });
        return deferred.promise();
    }

    let data = await _loadSettings();
    pj.Settings.settings = {};
    if (data) {
        $.each(data[pj.Settings.storageKey], function (i, val) {
            pj.Settings.settings[i] = val;
        });
        if (data[pj.Settings.storageKey] != null)
            pj.Log("Settings were successfully loaded");
        else {
            pj.Log("Looks like it is the first run. Initializing with default settings.");
            pj.Settings.LoadDefaultSettings();
        }
    }
};

pj.Settings.LoadDefaultSettings = function () {
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_HEIGHT] = 250;
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_WIDTH] = 300;

    let offset = pj.chatInput.offset();
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_POS_X] = offset.left;
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_POS_Y] = offset.top - pj.Settings.settings[pj.Settings.keys.PJ_SETTING_WIDTH];

    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES] = true;
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_BTTV_EMOTES] = false;
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_FFZ_EMOTES] = false;

    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST] = [];
};

pj.Settings.SavePosition = function () {
    let offset = pj.mainFrame.offset();
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_POS_X] = offset.left;
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_POS_Y] = offset.top;
    pj.Settings.SaveSettings();
};

pj.Settings.SaveSize = function () {
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_WIDTH] = pj.mainFrame.width();
    pj.Settings.settings[pj.Settings.keys.PJ_SETTING_HEIGHT] = pj.mainFrame.height();
    pj.Settings.SaveSettings();
};