class PJStoredElement {
    constructor(id, text) {
        this.text = text;
        this.id = id;
    }

    appendTo(parent) {
        this.container = $(this.getContainerHtml()).appendTo(parent);
        this.controls = $(this.getControlsHtml()).appendTo(this.container);
        this.applyHandlers();
        return this.container;
    }

    getContainerHtml() {
        return "" +
            "<div pj-storage-id='" + this.id + "' class='pj-storedelement-container'>" +
            "   <div class=\"pj-storedelement-text\">" +
            "       <span>" + this.text + "</span>" +
            "   </div>" +
            "</div>";
    }

    getControlsHtml() {
        return "" +
        "<div class='pj-storedelement-controls'>" +
        "   <div title='Delete' class=\"ui-icon ui-icon-close pj-storage-button pj-button-delete pj-ui-icon\"></div>" +
        "   <div title='Edit' class=\"ui-icon ui-icon-pencil pj-storage-button pj-button-edit pj-ui-icon\"></div>" +
        "   <div title='Paste' class=\"ui-icon ui-icon-copy pj-storage-button pj-button-paste pj-ui-icon\"></div>" +
        "   <div title='Append' class=\"ui-icon ui-icon-plus pj-storage-button pj-button-append pj-ui-icon\"></div>" +
        "</div>"
    }

    applyHandlers() {
        this.controls.hide();
        this.container.click(function (event) {
            let controls = $(this).find("div.pj-storedelement-controls");
            if ($(controls).css('display') == 'none' ) {
                pj.Storage.HideAllStorageControls();
                controls.show("slide", { direction: 'right'});
            } else {
                controls.hide("slide", { direction: 'right'});
            }
            event.stopPropagation();
        });

        this.controls.find($(".pj-button-delete")).click({ caller: this }, function (event) {
            event.data.caller.removeFromStorage();
            event.stopPropagation();
        });

        this.controls.find($(".pj-button-edit")).click({ caller: this }, function (event) {
            event.data.caller.editEntry();
            event.stopPropagation();
        });

        this.controls.find($(".pj-button-paste")).click({ caller: this }, function (event) {
            event.data.caller.putToChatInput();
            event.stopPropagation();
        });

        this.controls.find($(".pj-button-append")).click({ caller: this }, function (event) {
            event.data.caller.appendToChatInput();
            event.stopPropagation();
        });
    }

    removeFromStorage() {
        pj.Log("Removing entry: " + this.id + " - " + this.text);
        let r = pj.Storage.GetStorageIndexById(this.id);
        if (r >= 0) {
            pj.Storage.storage.splice(r, 1);
            pj.Storage.SaveStorage();
            pj.Storage.RefreshContainer();
        } else {
            pj.Log("Error in function 'removeFromStorage'");
        }
    }

    editEntry() {
        pj.Log("Starting edit: " + this.id + " - " + this.text);
        pj.ShowEdit(this);
    }

    putToChatInput() {
        pj.Log("Putting to chat: " + this.text);
        pj.chatInput.val(this.text);
        pj.chatInput[0].dispatchEvent(new Event('input', {bubbles: true}));
        pj.chatInput.focus();
    }

    appendToChatInput() {
        pj.Log("Appending to chat: " + this.text);
        pj.chatInput.val(pj.chatInput.val() + " " + this.text);
        pj.chatInput[0].dispatchEvent(new Event('input', {bubbles: true}));
        pj.chatInput.focus();
    }

    getSimpleObject() {
        return {
            "id": this.id,
            "text": this.text
        }
    }

    hideControls() {
        this.controls.hide("slide", { direction: 'right'});
    }

    //
    // hideControls() {
    //     pj.Log("hiding controls for " + this.id);
    //
    //     $("div[pj-storage-id='']" )
    //
    // }
    //
    // showControls() {
    //     pj.Log("showing controls for " + this.id);
    //
    // }

}