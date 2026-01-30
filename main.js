const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("node:path");
const sqlite3 = require("sqlite3");
const sql3 = sqlite3.verbose();


if (require("electron-squirrel-startup")) {
  app.quit();
}


if (!app.isPackaged) {
  try {
    require("electron-reloader")(module, { debug: true, watchRenderer: true });
  } catch (e) {
    console.log("reloader not available", e);
  }
}


let today = new Date();
today.setHours(0,0,0,0);
let isoToday = today.toISOString().split("T")[0];




    // -- DATABASES -- //

// -> EXPENSE MANUAL CATEGORY DB WITH CREATION  OF THE TABLE
const dbPath = path.join(app.getPath("userData"), "expenses.db");
let expensesDB;

let dbReady = new Promise((resolve,reject) => {    
    expensesDB = new sql3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, function(err){
        if (err) {
            return reject(err);
        }


        let sql = `CREATE TABLE IF NOT EXISTS expenses (
            expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_name TEXT NOT NULL
        )`;

        let sqlAuto = `CREATE TABLE IF NOT EXISTS autoExpenses (
            expense_id INTEGER PRIMARY KEY AUTOINCREMENT,
            expense_name TEXT NOT NULL,
            expense_rep TEXT NOT NULL,
            expense_ammount FLOAT NOT NULL,
            first_date DATETIME DEFAULT CURRENT_DATE
        )`;

        let sqlEntries = `CREATE TABLE IF NOT EXISTS entries(
            entry_id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_date DATETIME DEFAULT CURRENT_DATE,
            entry_name TEXT NOT NULL,
            entry_ammount FLOAT NOT NULL
        )`;

        let sqlSort = `SELECT * FROM entries ORDER BY entry_date DESC`;


        expensesDB.run(sql, [], (err) => {
            if (err) {
                console.log('error creating expenses table');
                return;
            }
            console.log("created table")
        });
        expensesDB.run(sqlAuto, [], (err) => {
            if (err) {
                console.log("error creating auto expense table");
                return;
            }
            console.log("created table or already exists");
        });
        expensesDB.run(sqlEntries, [], (err) => {
            if (err) {
                console.log('error creating entris table');
                return;
            }
            console.log("created table or already exists");
        });
        expensesDB.run(sqlSort, [], (err) => {
            if (err) {
                console.log('error in sorting');
                return;
            }
            console.log("sorted")
        });
        resolve(expensesDB);
    })
});


// here we calculate in every start if we need to add
// any expenses to the entries or no
(async() => {
    await dbReady;
    let weeklyExpLst = []
    await new Promise((resolve,reject) => {expensesDB.all('SELECT * FROM autoExpenses WHERE expense_rep="Weekly"',[],(err,rows) => {
        if (err){
            return reject(err);
        }
        rows.forEach((row) => {
            weeklyExpLst.push({expense_name: row.expense_name, expense_ammount: row.expense_ammount});
        });
        resolve(rows);
    })});

    for (const expObj of weeklyExpLst) {
        let entry_name = expObj.expense_name;
        let entry_ammount = expObj.expense_ammount;
        await new Promise((resolve,reject) => {expensesDB.all('SELECT * FROM entries WHERE entry_name=? ORDER BY entry_date DESC LIMIT 1',[entry_name],(err,value) => {
            if (err) return reject(err);
            if (!value || value.length === 0) return resolve([]);
            const [y, m, d] = value[0].entry_date.split("-").map(Number);
            let lastDate = new Date(y, m - 1, d);
            while (lastDate < today){
                lastDate.setDate(lastDate.getDate() + 1);
                if (lastDate.getDay() === 1){
                    let isoLastDate = lastDate.toISOString().split("T")[0];
                    addEntries(isoLastDate, entry_name, entry_ammount);
                }
            }
            resolve(value);
        })});
    };
    console.log("all checked")
})();

// here we calculate in every start
// if we need to add monthly expenses or no
(async() => {
    await dbReady;
    let monthlyExpLst = []
    await new Promise((resolve,reject) => {expensesDB.all('SELECT * FROM autoExpenses WHERE expense_rep="Monthly"',[],(err,rows) => {
        if (err){
            return reject(err);
        }
        rows.forEach((row) => {
            monthlyExpLst.push({expense_name: row.expense_name, expense_ammount: row.expense_ammount});
        });
        resolve(rows);
    })});

    for (const expObj of monthlyExpLst) {
        let entry_name = expObj.expense_name;
        let entry_ammount = expObj.expense_ammount;
        await new Promise((resolve,reject) => {expensesDB.all('SELECT * FROM entries WHERE entry_name=? ORDER BY entry_date DESC LIMIT 1',[entry_name],(err,value) => {
            if (err) return reject(err);
            if (!value || value.length === 0) return resolve([]);
            const [y, m, d] = value[0].entry_date.split("-").map(Number);
                let lastDate = new Date(y, m - 1, d);
                while (lastDate < today){
                    lastDate.setDate(lastDate.getDate() + 1);
                    if (lastDate.getDate() === 1){
                        let isoLastDate = lastDate.toISOString().split("T")[0];
                        addEntries(isoLastDate, entry_name, entry_ammount);
                    }
                }
            resolve(value);
        })});
    };
})();

// here we calculate in every start
// if we need to add yearly expenses or no
(async() => {
    await dbReady;
    let yearlyExpLst = []
    await new Promise((resolve,reject) => {expensesDB.all('SELECT * FROM autoExpenses WHERE expense_rep="Yearly"',[],(err,rows) => {
        if (err){
            return reject(err);
        }
        rows.forEach((row) => {
            yearlyExpLst.push({expense_name: row.expense_name, expense_ammount: row.expense_ammount});
        });
        resolve(rows);
    })});

    for (const expObj of yearlyExpLst) {
        let entry_name = expObj.expense_name;
        let entry_ammount = expObj.expense_ammount;
        await new Promise((resolve,reject) => {expensesDB.all('SELECT * FROM entries WHERE entry_name=? ORDER BY entry_date DESC LIMIT 1',[entry_name],(err,value) => {
            if (err) return reject(err);
            if (!value || value.length === 0) return resolve([]);
            const [y, m, d] = value[0].entry_date.split("-").map(Number);
            let lastDate = new Date(y, m - 1, d);
            while (lastDate < today){
                lastDate.setDate(lastDate.getDate() + 1);
                if (lastDate.getDate() === 1 && lastDate.getMonth() === 0){
                    let isoLastDate = lastDate.toISOString().split("T")[0];
                    addEntries(isoLastDate, entry_name, entry_ammount);
                }
            }
            resolve(value);
        })});
    };
})();






    // -- DATABASE RELATED FUNCTIONS -- //

//Get all data rows from manual expenses table and 
// send them to front
function getManualExpenses() {
    let sql = 'SELECT * FROM expenses'
    let expenses = []
    let content
    return new Promise((resolve, reject) => {
        expensesDB.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            expenses.push({ id: row.expense_id, name: row.expense_name});
        });
        content = JSON.stringify(expenses);
        resolve(expenses);
        })
    })
}

// Add Manual Expenses 
function addManualExpenses(expName) {
    let sql = 'INSERT INTO expenses(expense_name) VALUES(?)'
    try{
        expensesDB.run(sql, [expName], (err) => {
            if(err) {
                throw err;
            }
            console.log("expense inserted successfully")
        });
    }catch(err){
        console.log(err.message);
    }
}

// Delete Manual Expenses
function delManualExpenses(expId) {
    let sql = 'DELETE FROM expenses WHERE expense_id=?';
    try{
        expensesDB.run(sql, [expId], (err) => {
            if(err){
                throw err;
            }
            console.log("item deleted")
        })
    }catch(err){
        console.log(err.message);
    }
}


//Get all data rows from automated expenses table and 
// send them to front
function getAutoExpenses() {
    let sql = 'SELECT * FROM autoExpenses'
    let expenses = []
    return new Promise((resolve, reject) => {
        expensesDB.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        rows.forEach((row) => {
            expenses.push({ id: row.expense_id, name: row.expense_name, every: row.expense_rep, cost: row.expense_ammount});
        });
        resolve(expenses);
        })
    })
}


//Add Automated Expenses
function addAutoExpenses(expName, repetition, ammount) {
    let sql = 'INSERT INTO autoExpenses(expense_name, expense_rep, expense_ammount, first_date) VALUES(?,?,?,?)'
    try{
        expensesDB.run(sql, [expName, repetition, ammount, isoToday], (err) => {
            if(err) {
                throw err;
            }
            addEntries(isoToday, expName, ammount);
            console.log("expense inserted successfully");
        });
    }catch(err){
        console.log(err.message);
    }
}


// Delete Auto Expenses
function delAutoExpenses(expId) {
    let sql = 'DELETE FROM autoExpenses WHERE expense_id=?';
    try{
        expensesDB.run(sql, [expId], (err) => {
            if(err){
                throw err;
            }
            console.log("item deleted")
        })
    }catch(err){
        console.log(err.message);
    }
}


//Insert Entries
function addEntries(entrDate, entrName, ammount) {
    let sql = 'INSERT INTO entries(entry_date, entry_name, entry_ammount) VALUES(?,?,?)';
    try{
        expensesDB.run(sql, [entrDate, entrName, ammount], (err) => {
            if(err) {
                throw err;
            }
            console.log("entry inserted successfully");
        });
    }catch(err){
        console.log(err.message);
    }
}


// Get all Entries for Specified Years 
function getAllEntries() {
    let sql = `
        SELECT * FROM entries ORDER BY entry_date ASC
    `
    return new Promise((resolve, reject) => {
        expensesDB.all(sql, [], (err, rows) => {
        if (err) {
             reject(err);
        }
        let revenues = [];
        let expObj = [];

        rows.forEach((row) => {
            const ammount = Number(row.entry_ammount);
            const exists = expObj.find(
                (exp) => exp.entry_name === row.entry_name
            );
            const year = row.entry_date.split("-")[0];
            const dateExists = revenues.find((rev) => 
                rev.entry_date === year
            );

            if (row.entry_name === "Revenue"){
                if (dateExists){
                    dateExists.entry_ammount += Number(row.entry_ammount);
                }
                else{
                    revenues.push({entry_date: row.entry_date.split("-")[0], entry_name: row.entry_name, entry_ammount: Number(row.entry_ammount)});
                }
            }
            else if (!exists){
                expObj.push({entry_date: "All Years",entry_name: row.entry_name,entry_ammount: ammount});
            }
            else{
                exists.entry_ammount += ammount;
            }
        });
        resolve([revenues, expObj]);
        });
    });
}


// Delete Entries
function delEntries(name,date) {
    let sql;
    let dateLst = date.split("-")
    if(date === "All Years"){
        sql = 'DELETE FROM entries WHERE entry_name=?';
        dateLst = [];
    }
    else if (dateLst.length === 1){
        sql = 'DELETE FROM entries WHERE entry_name=? AND strftime("%Y",entry_date)=?';
    }
    else if (dateLst.length === 2){
        sql = 'DELETE FROM entries WHERE entry_name=? AND strftime("%Y",entry_date)=? AND strftime("%m",entry_date)=?';
    }
    else{
        sql = 'DELETE FROM entries WHERE entry_name=? AND strftime("%Y",entry_date)=? AND strftime("%m",entry_date)=? AND strftime("%d",entry_date)=?';
    }
    dateLst.unshift(name);
    try{
        expensesDB.run(sql, dateLst, (err) => {
            if(err){
                throw err;
            }
            console.log("item deleted");
        })
    }catch(err){
        console.log(err.message);
    }
}


// Gets the next entries that the user asked
function nextEntries(date){
    let sql
    let dateLSt = date.split("-");

    if (dateLSt.length === 1){
        sql = `
            SELECT * FROM entries WHERE strftime('%Y',entry_date)=? ORDER BY entry_date ASC
        `;
    }
    else if(dateLSt.length === 2){
        sql = `
            SELECT * FROM entries WHERE strftime('%Y',entry_date)=? AND
            strftime('%m',entry_date)=? ORDER BY entry_date ASC
        `;
    }
    else if(dateLSt.length === 3){
        sql = `
            SELECT * FROM entries WHERE strftime('%Y',entry_date)=? AND
            strftime('%m',entry_date)=? AND
            strftime('%d',entry_date)=? ORDER BY entry_date ASC
        `;
    }

    return new Promise((resolve, reject) => {

        expensesDB.all(sql, dateLSt, (err, rows) => {
            if (err){
                reject(err);
            }
            let revenues = [];
            let expObj = [];

            rows.forEach((row) => {

                let rowDateLst = row.entry_date.split("-")
                let ammount = Number(row.entry_ammount);
                let curDate 
                if (dateLSt.length === 1){
                    curDate = `${rowDateLst[0]}` + '-' + `${rowDateLst[1]}`;
                }
                else if (dateLSt.length === 2){
                    curDate = `${rowDateLst[0]}` + '-' + `${rowDateLst[1]}` + '-' + `${rowDateLst[2]}`;
                }
                else if (dateLSt.length === 3){
                    curDate = date;
                }

                // for revenues
                if (row.entry_name === "Revenue"){
                    const revExists = revenues.find(
                        rev => rev.entry_date === curDate
                    );
                    if (revExists){
                        revExists.entry_ammount += ammount;
                    }
                    else{
                        revenues.push({entry_date: curDate, entry_name: row.entry_name, entry_ammount: ammount});
                    }

                }
                else {
                    const expExists = expObj.find(exp => exp.entry_name === row.entry_name);
                    if(expExists){
                        expExists.entry_ammount += ammount;
                    }
                    else{
                        expObj.push({entry_date:date, entry_name: row.entry_name, entry_ammount: ammount});
                    }
                }
            })
            resolve([revenues, expObj]);
        });
    });
}


// Gets previous time entries from the ones that the user is currently
function prevEntries(values){

    const state = Number(values[0]);
    const date = values[1];
    const dateLSt = date.split("-")
    let sql;
    let finalDateLst;

    if (state === 4){
        sql = `
            SELECT * FROM entries WHERE strftime('%Y',entry_date)=? AND
            strftime('%m',entry_date)=? ORDER BY entry_date ASC
        `;
        finalDateLst = [dateLSt[0],dateLSt[1]]
    } 
    else if (state === 3){
        sql = `
            SELECT * FROM entries WHERE strftime('%Y',entry_date)=? ORDER BY entry_date ASC
        `;
        finalDateLst = [dateLSt[0]];
    }

    return new Promise((resolve, reject) => {

        expensesDB.all(sql, finalDateLst, (err, rows) => {
            if (err){
                reject(err);
            }
            let revenues = [];
            let expObj = [];

            rows.forEach((row) => {

                let rowDateLst = row.entry_date.split("-");
                let ammount = Number(row.entry_ammount);
                let curDate; 
                let expDate;
                if (state === 4){
                    curDate = `${rowDateLst[0]}` + '-' + `${rowDateLst[1]}` + '-' + `${rowDateLst[2]}`;
                    expDate = `${rowDateLst[0]}` + '-' + `${rowDateLst[1]}`;
                }
                else if (state === 3){
                    curDate = `${rowDateLst[0]}` + '-' + `${rowDateLst[1]}`;
                    expDate = `${rowDateLst[0]}`;
                }

                // for revenues
                if (row.entry_name === "Revenue"){
                    const revExists = revenues.find(
                        rev => rev.entry_date === curDate
                    );
                    if (revExists){
                        revExists.entry_ammount += ammount;
                    }
                    else{
                        revenues.push({entry_date: curDate, entry_name: row.entry_name, entry_ammount: ammount});
                    }

                }
                // for expenses
                else {
                    const expExists = expObj.find(exp => exp.entry_name === row.entry_name);
                    if(expExists){
                        expExists.entry_ammount += ammount;
                    }
                    else{
                        expObj.push({entry_date: expDate, entry_name: row.entry_name, entry_ammount: ammount});
                    }
                }
            })
            resolve([revenues, expObj]);
        });
    });
}






let win
const createWindow = () => {
    win = new BrowserWindow({
        width: 1000,
        height: 700,
        autoHideMenuBar: true,
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: true,
        icon: path.join(__dirname, "assets", "icon.ico"),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    win.loadFile('renderer/index.html');
}



ipcMain.handle("addCategory", async(event, value) => {
    addManualExpenses(value[0]);
    let manExpenseArr = await getManualExpenses(); 
        
    if (manExpenseArr.length !== 0) {
            win.webContents.send("sendCategory", manExpenseArr);
    }
    else{
        win.webContents.send("sendCategory", []);
        console.log("none");
    }
    return "done"
});


ipcMain.handle("addRepCategory", async(event, value) => {
    let name = value[0];
    let rep = value[1];
    let cost = value[2];
    addAutoExpenses(name, rep, cost);
    let autoExpenseArr = await getAutoExpenses();
        
    if (autoExpenseArr.length !== 0) {
        win.webContents.send("sendAutoCategory", autoExpenseArr);
    }
    else{
        win.webContents.send("sendAutoCategory", []);
        console.log("none");
    }
    return "done"
});


// get next entries when an entry is clicked
ipcMain.handle("nextEntries", async(event,value) => {
    const entrLst = await nextEntries(value);
    return entrLst;
});


//Get previous entries from the current timeline
ipcMain.handle("prevEntries", async(event, value) => {

    const state = Number(value[0]);
    let entrLst;
    if (state === 2){
        entrLst = await getAllEntries();
    }
    else{
        entrLst = await prevEntries(value);
    }
    return entrLst;
});


// Add Entry To Tracker DB
ipcMain.on("addExpNRevenue", (event, value) => {

    const entrDate = value[0];
    const entrName = value[1];
    const ammount = value[2];

    addEntries(entrDate, entrName, ammount);
});


// Delete from manual expenses when del button triggered
ipcMain.on("delManualCategory", (event, value) => {
    delManualExpenses(value);
});

// Delete from Auto expenses when del button triggered
ipcMain.on("delAutoCategory", (event, value) => {
    delAutoExpenses(value);
});

//Delete Revenues From entries when del btn is triggered
ipcMain.on("delRevEntries", (event, value) => {
    const name = value[0];
    const date = value[1];
    delEntries(name, date);
});


ipcMain.on("renderer:ready", async () => {
    try{
        let manExpenseArr = await getManualExpenses(); 
        
        if (manExpenseArr.length !== 0) {
            win.webContents.send("sendCategory", manExpenseArr);
        }
        else{
            win.webContents.send("sendCategory", []);
            console.log("none");
        }
    }catch (err) {
        win.webContents.send("sendCategory", []);
        console.log(err);
    }

    try{
        let autoExpenseArr = await getAutoExpenses();
        
        if (autoExpenseArr.length !== 0) {
            win.webContents.send("sendAutoCategory", autoExpenseArr);
        }
        else{
            win.webContents.send("sendAutoCategory", []);
            console.log("none");
        }
    }catch (err) {
        win.webContents.send("sendAutoCategory", []);
        console.log(err);
    } 

    try{
        let entryArr = await getAllEntries(); 
        
        if (entryArr.length !== 0) {
            win.webContents.send("sendEntries", entryArr);
        }
        else{
            win.webContents.send("sendEntries", []);
            console.log("none");
        }
    }catch (err) {
        win.webContents.send("sendEntries", []);
        console.log(err);
    }

});

ipcMain.on("reload", async (event, value) => {
    
    const state = Number(value[0]);
    const relDate = value[1];
    const relDateList = relDate.split("-");
    const s2Date = `${relDateList[0]}` 
    const s3Date = `${relDateList[0]}` + '-' + `${relDateList[1]}`
    const s4Date = `${relDateList[0]}` + '-' + `${relDateList[1]}` + '-' + `${relDateList[2]}`
    let manExpenseArr;

    try{
        let manExpenseArrS = await getManualExpenses(); 
        
        if (manExpenseArrS.length !== 0) {
            win.webContents.send("sendCategory", manExpenseArrS);
        }
        else{
            win.webContents.send("sendCategory", []);
            console.log("none");
        }
    }catch (err) {
        win.webContents.send("sendCategory", []);
        console.log(err);
    }

    try{
        let autoExpenseArr = await getAutoExpenses();
        
        if (autoExpenseArr.length !== 0) {
            win.webContents.send("sendAutoCategory", autoExpenseArr);
        }
        else{
            win.webContents.send("sendAutoCategory", []);
            console.log("none");
        }
    }catch (err) {
        win.webContents.send("sendAutoCategory", []);
        console.log(err);
    } 

    try{
        if (state === 1){
            manExpenseArr = await getAllEntries(); 
        }
        else if ( state === 2){
            manExpenseArr = await nextEntries(s2Date);
        }
        else if (state === 3){
            manExpenseArr = await nextEntries(s3Date);
        }
        else if (state === 4){
            manExpenseArr = await nextEntries(s4Date);
        }
        
        if (manExpenseArr.length !== 0) {
            win.webContents.send("sendTables", manExpenseArr);
        }
        else{
            win.webContents.send("sendTables", []);
            console.log("none");
        }
    }catch (err) {
        win.webContents.send("sendTables", []);
        console.log(err);
    }

})





app.on('ready', () => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0){createWindow()}
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin'){app.quit()}
});

