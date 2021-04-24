pj.Settings.internalParameters = {
    loadDelay: 3000,
    isDebug: false
};

pj.Log = function (text) {
    if (pj.Settings.internalParameters.isDebug)
        console.log(text);
};

pj.LogError = function (text) {
    console.error(text);
};

pj.LoadMainFrame = async function () {

    //pj.ClearStorageData();

    pj.Log("Loading main frame");
    let mainFrameHtml = await pj.loadHtml('../html/pj-main-frame.html');
    $($.parseHTML(mainFrameHtml)).appendTo('body');
    pj.mainFrame = $(".pj-main-frame");
    pj.mainFrame.hide();

    //setting main frame functionality
    pj.mainFrame.draggable({handle: "div#main-drag-handle", containment: "window", stop: pj.Settings.SavePosition });
    $("#pj-main-button-close").click(pj.ToggleMainFrame);
    pj.mainFrame.resizable({stop: pj.Settings.SaveSize});

    pj.headerCaption = $("span.pj-header-text");

    pj.chatInput = $("div.chat-input").find($("textarea"));
    await pj.Settings.LoadSettings();

    let chatOffset = pj.chatInput.offset();

    pj.mainFrame.width(pj.Settings.settings[pj.Settings.keys.PJ_SETTING_WIDTH]);
    pj.mainFrame.height(pj.Settings.settings[pj.Settings.keys.PJ_SETTING_HEIGHT]);
    pj.mainFrame.offset({
        top: chatOffset.top - pj.Settings.settings[pj.Settings.keys.PJ_SETTING_WIDTH],
        left: chatOffset.left
    });

    pj.storageFrame = $(".pj-storage-frame");
    pj.editFrame = $(".pj-edit-frame");
    pj.settingsFrame = $(".pj-settings-frame");
    pj.aboutFrame = $(".pj-about-frame");

    await pj.Storage.Init();
    pj.EditFrame.Init();

    pj.Settings.Init();
    $("#pj-main-button-show-settings").click(function () {
        if (pj.settingsFrame.filter(":visible").length > 0)
            pj.ShowStorage();
        else
            pj.ShowSettings();
    });

    pj.AboutFrame.Init();
    $("#pj-main-button-show-about").click(function () {
        if (pj.aboutFrame.filter(":visible").length > 0)
            pj.ShowStorage();
        else
            pj.ShowAbout();
    });

    pj.mainFrame.click(pj.Storage.HideAllStorageControls);

    pj.ShowStorage();

};

pj.AddMainButton = function () {

    pj.Log("Adding button to Twitch UI");
    let buttonHtml =
        "<button class=\"tw-button-icon pj-button\" id=\"pj-main-button\">" +
        "    <img src=\"" + chrome.extension.getURL('../img/pj_28.png') + "\">" +
        "</button>";
    $($.parseHTML(buttonHtml)).appendTo($(".chat-input__buttons-container div").first());
    $("#pj-main-button").click(pj.ToggleMainFrame);

};

pj.ToggleMainFrame = function () {
    pj.mainFrame.toggle();
};

pj.isChatPresent = function () {
    //var r = $("textarea[data-a-target='chat-input']").length > 0;
    return $("div.chat-input").length > 0;
};

pj.loadHtml = async function (filename) {
    try {
        let url = chrome.extension.getURL(filename);
        return await $.get(url);
    }
    catch (err) {
        pj.LogError("Error: " + err)
    }
};

pj.Init = async function () {
    pj.Log("Pasta Jar");
    pj.Log($(".chat-input__buttons-container") > 0);
    $.initialize(".chat-input__buttons-container", async function () {
        if (!pj.isChatPresent())
            pj.LogError("Error! Can't find chat window. Aborting.");
        else {
            pj.Log("Found chat window. Initializing.");

            //Remove any previous instances
            if (pj.mainFrame != null)
                pj.Dispose();

            //Load html for main frame.
            await pj.LoadMainFrame();

            //Add button to twitch UI.
            pj.AddMainButton();

            pj.Log("Initialization complete");
        }
    });
};

pj.ShowStorage = function () {

    pj.storageFrame.show();
    pj.editFrame.hide();
    pj.settingsFrame.hide();
    pj.aboutFrame.hide();
    pj.SetCaption("Pasta Jar");
};

pj.ShowEdit = function (element) {
    let editElement;
    if (element == null)
        editElement = new PJStoredElement(pj.Storage.GenerateId(), "");
    else
        editElement = element;

    pj.EditFrame.SetSource(editElement);

    pj.storageFrame.hide();
    pj.editFrame.show();
    pj.settingsFrame.hide();
    pj.aboutFrame.hide();
    pj.SetCaption("Editing");

    pj.EditFrame.textArea.focus();
};

pj.ShowSettings = function () {
    pj.storageFrame.hide();
    pj.editFrame.hide();
    pj.settingsFrame.show();
    pj.aboutFrame.hide();
    pj.SetCaption("Settings");
};

pj.ShowAbout = function () {
    pj.storageFrame.hide();
    pj.editFrame.hide();
    pj.settingsFrame.hide();
    pj.aboutFrame.show();
    pj.SetCaption("About");
};

pj.SetCaption = function(text) {
    pj.headerCaption.text(text);
};

pj.Dispose = function () {
    pj.mainFrame.remove();
};

pj.ClearStorageData = function () {
    chrome.storage.local.clear();
    localStorage.clear();
};

//Init load after delay
setTimeout(pj.Init, pj.Settings.internalParameters.loadDelay);