pj.EditFrame = {
    textArea: undefined,
    previewArea: undefined,
    editItem: undefined
};

pj.EditFrame.Init = function () {
    pj.EditFrame.previewArea = $("#pj-preview-container");
    pj.EditFrame.textArea = $("#pj-pasta-edit-box");

    pj.EditFrame.textArea.on('input', async function(e) {
        await pj.EditFrame.EditToPreview();
    });

    pj.editFrame.find($("#pj-edit-cancel-button")).click(function () {
        pj.ShowStorage();
    });

    pj.editFrame.find($("#pj-edit-accept-button")).click(function () {
        if ( $.trim(pj.EditFrame.textArea.val()) == '' ) {
            // TODO show error message
        } else {
            pj.Storage.AddOrUpdate(new PJStoredElement(pj.EditFrame.editItem.id, pj.EditFrame.textArea.val()));
            pj.ShowStorage();
        }
    })
};

pj.EditFrame.EditToPreview = async function () {
    let str = pj.EditFrame.textArea.val();
    let newPreview = $("<p></p>");
    newPreview.html(str);
    if (pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES])
        await newPreview.kappa({channels: pj.Settings.settings[pj.Settings.keys.PJ_SETTING_LOAD_EMOTES_CHANNEL_LIST]});
    pj.EditFrame.previewArea.html(newPreview.html());
};

pj.EditFrame.SetSource = async function (item) {
    pj.EditFrame.editItem = item;
    pj.EditFrame.textArea.val(item.text);
    await pj.EditFrame.EditToPreview();
};