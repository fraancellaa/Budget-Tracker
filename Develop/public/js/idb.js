// variable for db connection
let db;
// connection to IndexedDB db "budget_tracker", version 1
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function(event) {
    const db = event.target.result;
    db.createObjectStore('new_budget', { autoIncrement: true });
};

// on success
request.onsuccess = function (event) {
    // when db is successfully created with its object store, save reference to db in global variant
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function(event) {
    // log error here
    console.log(event.target.errorCode);
}

// save record of new budget
function saveRecord(record) {
    const transaction = db.transaction(['new_budget'], 'readwrite');

    const budgetStore = transaction.objectStore('new_budget');

    // add record to your store with add method.
    budgetStore.add(record);

    function uploadBudget() {
        // open a transaction on your pending db
        const transaction = db.transaction(['new_budget'], 'readwrite');

        // access your pending object store
        const budgetStore = transaction.objectStore('new_budget');

        // get all records from store and set to a variable
        const getAll = budgetStore.getAll();

        // after getAll success function execution, run this
        getAll.onsuccess = function() {
            if(getAll.result.length > 0) {
                fetch("/api/transaction/bulk", {
                    method: "POST",
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json"
                    }
                })
                .then(response => response.json())
                .then(() => {
                    const transaction = db.transaction(['new_budget'], "readwrite");
                    // access the new_budget object store
                    const budgetStore = transaction.objectStore("new_budget");
                    // clear items
                    budgetStore.clear();
                });
            }
        };
    }

    // event listener to when app comes back online
    window.addEventListener("online", uploadBudget);
}