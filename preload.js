const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('ipc', {

    rendererReady: () => ipcRenderer.send("renderer:ready"),

    changeReload: (value) => ipcRenderer.send("reload", value),

    //Sends The New Expense Category Info
    addCategory: (value) => ipcRenderer.invoke("addCategory", value),

    //Sends A Day's Revenue And Expenses
    addExpNRevenue: (value) => ipcRenderer.send("addExpNRevenue",value),

    //Sends Expenses Categories To Front
    onSendCategory: (callback) => ipcRenderer.on("sendCategory", (_event, value) => callback(value)),

    //Sends Expenses Categories To Front
    onSendAutoCategory: (callback) => ipcRenderer.on("sendAutoCategory", (_event, value) => callback(value)),

    onSendTables: (callback) => ipcRenderer.on("sendTables", (_event, value) => callback(value)),

    //Send Entries and Revenue to Front
    onSendEntries: (callback) => ipcRenderer.on("sendEntries", (_event, value) => callback(value)),

    //Signals to Delete a Manual Expense
    delManualCategory: (value) => ipcRenderer.send("delManualCategory", value),

    delAutoCategory: (value) => ipcRenderer.send("delAutoCategory", value),

    //Sends New Repeatable Category Info
    addRepCategory: (value) => ipcRenderer.invoke("addRepCategory", value),

    //Sends All entries when called
    nextEntries: (value) => ipcRenderer.invoke("nextEntries", value),

    //Sends All previous entries when back button called
    prevEntries: (value) => ipcRenderer.invoke("prevEntries", value),

    //Deletes revenue Entries According to Date
    delRevEntries: (value) => ipcRenderer.send("delRevEntries", value),

    //Deletes expense Entries According to Date
    delExpEntries: (value) => ipcRenderer.send("delExpEntries", value)

});