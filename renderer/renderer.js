const tabs = document.querySelectorAll('.folder-tab');
const pages = document.querySelectorAll('.page');

// Expense Types Page Selectors
const ETexpenseName = document.querySelector("#expense-txt");
const ETexpRepetitionDropD = document.querySelector('#expense-repeat');
const ETexpAmmount = document.querySelector('#expense-ammount');
const ETAddButton = document.querySelector('#add-expense-category');

// Manual Entries Page Selector
const datePick = document.querySelector("#datePick");
const MErevenuInp = document.querySelector("#revenue-inp");
const MEdropD = document.querySelector("#expenses-dropD");
const MEexpenseInp = document.querySelector("#daily-exp");
const MEaddExpense = document.querySelector("#exp-submit");
const METoTrackerButton = document.querySelector("#submit-to-track");
const MATable = document.querySelector("#manual-entries");

// Analytics Page Selectors
const backButton = document.querySelector("#back");
const totalR = document.querySelector("#total-revenue-wrap").querySelector("#totalRevenueCell");
const totalE = document.querySelector("#total-expense-wrap").querySelector("#totalExpenseCell");

//confirm popup
const overlay = document.querySelector("#overlay");
const confirmPopup = document.querySelector("#confirm-popup");
const confBtn = document.querySelector("#confirm-yes");
const cancelBtn = document.querySelector("#confirm-cancel");

// INDEX TO WHICH DETERMINES IN WHICH TIMELINE STATE
let state = 1;

const revDate = document.querySelector("#revenue-table").querySelector("#expensesBody");

function getCurRevDate(){
    const tr = revDate.querySelector("tr.data");
    if (tr && tr.querySelector(".date")) return tr.querySelector(".date").textContent;
    const y = new Date().getFullYear();
    return String(y);
}

let confirmAction = null;

function openPopup(action){
    confirmAction = action;
    overlay.classList.remove("hidden");
    confirmPopup.classList.remove("hidden");
}

function closePopup(){
    confirmAction = null;
    overlay.classList.add("hidden");
    confirmPopup.classList.add("hidden");
}

confBtn.addEventListener("click", () => {
    if (confirmAction) confirmAction();
    closePopup();
});

cancelBtn.addEventListener("click", () => {
    closePopup();
});

//showing that renderer is ready
window.ipc.rendererReady();

// Moving Between Tabs And Page Set
tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
        const id = Number(tab.id) - 1;
        for (let i = 0; i < tabs.length; i++){
            if(i!==id){
                tabs[i].classList.remove('selected');
                pages[i].classList.remove('selected');
            }
            else {
                tabs[i].classList.add('selected');
                pages[i].classList.add('selected');
            }
        }
    });
});

// Expense Type Drop Down Event Listener
ETexpRepetitionDropD.addEventListener("change", async() => {
    let value = ETexpRepetitionDropD.value;
    if (value !== "Manual"){
        ETexpAmmount.classList.add("active");
    }
    else{
        ETexpAmmount.classList.remove("active")
    }
});

// Expense Type Category Addition Button Event Listener
ETAddButton.addEventListener("click", async () => {
    let categoryArr = [];
    let reply;
    const nameValue = ETexpenseName.value;

    if (nameValue){
        if (ETexpAmmount.classList.contains("active")){
            const ammountValue = ETexpAmmount.value;
            const repeatValue = ETexpRepetitionDropD.value;
            categoryArr = [nameValue, repeatValue, ammountValue];
            reply = await window.ipc.addRepCategory(categoryArr);
        }else{
            categoryArr = [nameValue, "Manual"];
            reply = await window.ipc.addCategory(categoryArr);
        }

        window.ipc.changeReload([state, getCurRevDate()]);

        ETexpenseName.value = '';
        ETexpAmmount.value = '';
        ETexpRepetitionDropD.value = '';
        ETexpAmmount.classList.remove("active");

        console.log(reply);
    }
});

//Event Listener To Add Expense To the Selected Date
MEaddExpense.addEventListener("click", () => {

    const date = datePick.value;
    const expenseAmmount = MEexpenseInp.value;
    const opt = MEdropD.selectedOptions[0];
    const dropDId = MEdropD.value;
    const dropDText = opt ? opt.textContent : '';

    const tBody = MATable.querySelector("tbody");

    if (date && Number(expenseAmmount) && dropDId) {

        let expArr = tBody.querySelectorAll("tr");
        expArr.forEach((row) => {
            if (!row.querySelector("td") || !row.querySelector("td").classList.contains("date")){
                row.remove();
            }
        });

        const html = `             
            <tr class="data">
                <td class="date">${date}</td>
                <td class="exp-category">${dropDText}</td>
                <td class="exp-ammount">${expenseAmmount}</td>
                <td class="actions">
                  <button class="delete-btn" title="Delete expense">
                    🗑️
                  </button>
                </td>
            </tr>`;

        tBody.insertAdjacentHTML("afterbegin",html);

        const delBtn = tBody.querySelector("tr.data").querySelector(".delete-btn");
        delBtn.addEventListener("click", () => {
            const tr = delBtn.parentNode.parentNode;
            openPopup(() => {
                tr.remove();
                if(!tBody.querySelector("tr.data")){
                    tBody.insertAdjacentHTML("afterbegin", `
                        <tr class="default">
                            <td> - </td><td> - </td><td> - </td><td> - </td>
                        </tr>
                    `);
                }
            });
        });

        MEdropD.value = '';
        MEexpenseInp.value = '';
    }

});

//Send All Info to Tracker (DataBase) Button and Clear Inputs
METoTrackerButton.addEventListener("click", () => {

    const date = datePick.value;
    const tBody = MATable.querySelector("tbody");

    if (MErevenuInp.value && date && Number(MErevenuInp.value)){
        window.ipc.addExpNRevenue([date, "Revenue", MErevenuInp.value]);
    }

    const expDataArr = tBody.querySelectorAll("tr.data");
    expDataArr.forEach((expense) => {
        const expDate = expense.querySelector(".date").textContent;
        const expCategory = expense.querySelector(".exp-category").textContent;
        const expAmmount = expense.querySelector(".exp-ammount").textContent;
        window.ipc.addExpNRevenue([expDate, expCategory, expAmmount]);
        expense.remove();
    });

    if(!tBody.querySelector("tr.data")){
        tBody.innerHTML = `
            <tr class="default">
                <td> - </td><td> - </td><td> - </td><td> - </td>
            </tr>
        `;
    }

    window.ipc.changeReload([state, getCurRevDate()]);

    MErevenuInp.value = '';
    datePick.value = '';
    MEdropD.value = '';
    MEexpenseInp.value = '';

});

// ANALYTICS TABLE BACK BUTTON LOGIC
backButton.addEventListener("click", async() => {
    const tr = revDate.querySelector("tr.data");
    if (!tr) return;
    const trDate = tr.querySelector(".date").textContent;

    if (state === 1){return}

    const newEntries = await window.ipc.prevEntries([state,trDate]);
    addRevenues(newEntries[0]);
    addExpenses(newEntries[1]);
    if (state > 1){state -= 1}
});

// RELOADING ALL TABLE AND EXPENSE DROPDOWN INFO
window.ipc.onSendCategory((expLst) => {
    const tWrap = document.querySelector("#e-t-wrap");
    const tBody = tWrap.querySelector("#expensesBody");
    tBody.innerHTML = '';
    MEdropD.innerHTML = '<option value="" disabled selected>Select An Expense</option>';

    let htmlTable;

    if (expLst.length > 0){
        expLst.forEach((expense) => {

            htmlTable = `
            <tr class="data" id="${expense.id}">
                <td>${expense.name}</td>
                <td class="actions">
                    <button class="delete-btn" title="Delete expense">🗑️</button>
                </td>
            </tr>
            `;

            const htmlDropD = `<option value="${expense.id}">${expense.name}</option>`;

            tBody.insertAdjacentHTML('afterbegin', htmlTable);
            MEdropD.insertAdjacentHTML('beforeend', htmlDropD);
        });
    }
    else{
        tBody.insertAdjacentHTML('afterbegin', `
            <tr class="default">
                <td> - </td>
                <td> - </td>
            </tr>
        `);

        MEdropD.insertAdjacentHTML('beforeend', `<option value="" disabled>No Expenses Created</option>`);
    }

    let expenses = tBody.querySelectorAll(".delete-btn");
    expenses.forEach((btn) => {
        btn.addEventListener("click", () => {
            let id = btn.parentNode.parentNode.id;

            openPopup(() => {
                MEdropD.querySelector(`option[value="${id}"]`)?.remove();
                window.ipc.delManualCategory(id);
                btn.parentNode.parentNode.remove();

                if (tBody.querySelectorAll("tr.data").length < 1){
                    tBody.insertAdjacentHTML('afterbegin', `
                        <tr class="default">
                            <td> - </td>
                            <td> - </td>
                        </tr>
                    `);
                }

                window.ipc.changeReload([state, getCurRevDate()]);
            });

        });
    });

    console.log(expLst);
});

// RELOADING ALL AUTO TABLE INFO
window.ipc.onSendAutoCategory((expLst) => {
    const tWrap = document.querySelector("#e-t-wrap-2");
    const tBody = tWrap.querySelector("#expensesBody");
    tBody.innerHTML = '';

    let htmlTable;

    if (expLst.length > 0){
        expLst.forEach((expense) => {

            htmlTable = `
            <tr class="data" id="${expense.id}">
                <td>${expense.name}</td>
                <td>${expense.every}</td>
                <td>${expense.cost}</td>
                <td class="actions">
                    <button class="delete-btn" title="Delete expense">🗑️</button>
                </td>
            </tr>
            `;

            tBody.insertAdjacentHTML('afterbegin', htmlTable);
        });
    }
    else{
        tBody.insertAdjacentHTML('afterbegin', `
            <tr class="default">
                <td> - </td>
                <td> - </td>
                <td> - </td>
                <td> - </td>
            </tr>
        `);
    }

    let expenses = tBody.querySelectorAll(".delete-btn");
    expenses.forEach((btn) => {
        btn.addEventListener("click", () => {
            let id = btn.parentNode.parentNode.id;

            openPopup(() => {
                window.ipc.delAutoCategory(id);
                btn.parentNode.parentNode.remove();

                if (tBody.querySelectorAll("tr.data").length < 1){
                    tBody.insertAdjacentHTML('afterbegin', `
                        <tr class="default">
                            <td> - </td>
                            <td> - </td>
                            <td> - </td>
                            <td> - </td>
                        </tr>
                    `);
                }

                window.ipc.changeReload([state, getCurRevDate()]);
            });

        });
    });

    console.log(expLst);
});

function addRevenues(revLst) {
    let r = 0;
    const revenueTable = document.querySelector("#revenue-table");
    const tBody = revenueTable.querySelector("#expensesBody");
    tBody.innerHTML = '';

    const defHtml = `
    <tr class="default">
        <td> - </td>
        <td> - </td>
        <td> - </td>
    </tr>
    `;

    if (revLst.length > 0){

        revLst.forEach((rev) => {
            const html = `
            <tr class="data">
                <td class="date">${rev.entry_date}</td>
                <td class="ammount">${rev.entry_ammount}</td>
                <td class="actions">
                    <button class="delete-btn" title="Delete expense">🗑️</button>
                </td>
            </tr>
            `;

            r += Number(rev.entry_ammount);
            tBody.insertAdjacentHTML("afterbegin", html);

            const tr = tBody.querySelector("tr.data");
            const delBtn = tr.querySelector(".delete-btn");
            const trDate = tr.querySelector(".date").textContent;

            delBtn.addEventListener("click", () => {
                openPopup(() => {
                    window.ipc.delRevEntries(["Revenue",trDate]);
                    const am = Number(tr.querySelector(".ammount").textContent);
                    tr.remove();
                    totalR.textContent = Number(totalR.textContent) - am;

                    if (!tBody.querySelector("tr.data")){
                        tBody.insertAdjacentHTML("afterbegin",defHtml);
                    }
                    window.ipc.changeReload([state, getCurRevDate()]);
                });
            });

            tr.addEventListener("dblclick", async() => {
                if (state === 4){return}
                const newEntries = await window.ipc.nextEntries(trDate);
                addRevenues(newEntries[0]);
                addExpenses(newEntries[1]);
                if (state < 4){state += 1}
            });

        });

        totalR.textContent = r;
    }
    else{
        tBody.insertAdjacentHTML("afterbegin",defHtml);
        totalR.textContent = 0;
    }
}

function addExpenses(expLst) {
    let e = 0;
    const expenseTable = document.querySelector("#entries-table");
    const tBody = expenseTable.querySelector("#expensesBody");
    tBody.innerHTML = '';

    const defHtml = `
    <tr class="default">
        <td> - </td>
        <td> - </td>
        <td> - </td>
        <td> - </td>
    </tr>
    `;

    if (expLst.length > 0){

        expLst.forEach((exp) => {
            const html = `
            <tr class="data">
                <td class="date">${exp.entry_date}</td>
                <td class="name">${exp.entry_name}</td>
                <td class="ammount">${exp.entry_ammount}</td>
                <td class="actions">
                    <button class="delete-btn" title="Delete expense">🗑️</button>
                </td>
            </tr>
            `;

            e += Number(exp.entry_ammount);
            tBody.insertAdjacentHTML("afterbegin", html);

            const tr = tBody.querySelector("tr.data");
            const delBtn = tr.querySelector(".delete-btn");

            delBtn.addEventListener("click", () => {
                openPopup(() => {
                    const trName = tr.querySelector(".name").textContent;
                    const trDate = tr.querySelector(".date").textContent;
                    const am = Number(tr.querySelector(".ammount").textContent);

                    window.ipc.delRevEntries([trName,trDate]);
                    tr.remove();
                    totalE.textContent = Number(totalE.textContent) - am;

                    if(!tBody.querySelector("tr.data")){
                        tBody.insertAdjacentHTML("afterbegin",defHtml);
                    }
                    window.ipc.changeReload([state, getCurRevDate()]);
                });
            });

        });

        totalE.textContent = e;
    }
    else{
        tBody.insertAdjacentHTML("afterbegin",defHtml);
        totalE.textContent = 0;
    }
}

window.ipc.onSendTables((entrArr) => {
    addRevenues(entrArr[0]);
    addExpenses(entrArr[1]);
});

window.ipc.onSendEntries((entrArr) => {
    addRevenues(entrArr[0]);
    addExpenses(entrArr[1]);
    console.log(entrArr);
});
