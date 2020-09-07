let db;

// databse creation with the request
const request = window.indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  // object store made here
  const budgetStore = db.createObjectStore("pending", {
    keyPath: "listID",
    autoIncrement: true,
  });
  budgetStore.createIndex("statusIndex", "status");
};

request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log(event.target.error.message);
};

function saveRecord(record) {
  // transaction made w/ readwrite
  const transaction = db.transaction(["pending"], "readwrite");
  // access the pending object store
  const pendingStore = transaction.objectStore("pending");
  // add record with add method.
  pendingStore.add(record);
}

function checkDatabase() {
  // open a transaction on your pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // access your pending object store
  const pendingStore = transaction.objectStore("pending");
  // get all records from store and set to a variable
  const getAll = pendingStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // open transaction
          const transaction = db.transaction(["pending"], "readwrite");
          // get to pending object store
          const pendingStore = transaction.objectStore("pending");
          // delete all items in store
          pendingStore.clear();
        });
    }
  };
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);
