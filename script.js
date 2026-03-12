const priceElement = document.getElementById("price");
const minuteList = document.getElementById("minuteList");
const lastUpdate = document.getElementById("lastUpdate");
const clock = document.getElementById("clock");
const intervalBody = document.getElementById("intervalBody");

const INTERVAL_MINUTES = 15; // change to 15 later

let latestPrice = null;

let currentInterval = null;
let intervals = [];
let lastIntervalClose = null;



async function fetchPrice() {

    try {

        const response = await fetch(
            "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
        );

        const data = await response.json();

        latestPrice = data.bitcoin.usd;

        priceElement.textContent = "$" + latestPrice.toLocaleString();

        lastUpdate.textContent = new Date().toLocaleTimeString();

    } catch (e) {

        console.log("API error", e);

    }

}



function updateClock() {

    clock.textContent = new Date().toLocaleTimeString();

}

setInterval(updateClock, 1000);



function recordMinutePrice() {

    if (latestPrice === null) return;

    const now = new Date();

    const timeStr = now.toLocaleTimeString();

    const li = document.createElement("li");

    li.textContent = timeStr + " — $" + latestPrice.toLocaleString();

    minuteList.prepend(li);



    const minute = now.getMinutes();

    const block = Math.floor(minute / INTERVAL_MINUTES);



    if (!currentInterval) {

        startNewInterval(now);

    }



    if (block !== currentInterval.block) {

        finishInterval();

        startNewInterval(now);

    }



    addMinuteBox(now, latestPrice);

}



function startNewInterval(time) {

    const openPrice = lastIntervalClose ?? latestPrice;

    currentInterval = {

        block: Math.floor(time.getMinutes() / INTERVAL_MINUTES),

        startTime: new Date(time),

        open: openPrice,

        row: null,

        minuteCell: null,

        closeCell: null,

        resultCell: null

    };



    const row = document.createElement("tr");



    const timeCell = document.createElement("td");

    timeCell.textContent = time.toLocaleTimeString([], {

        hour: "2-digit",

        minute: "2-digit"

    });



    const openCell = document.createElement("td");

    openCell.textContent = "$" + openPrice.toLocaleString();



    const minuteCell = document.createElement("td");



    const closeCell = document.createElement("td");

    closeCell.textContent = "-";



    const resultCell = document.createElement("td");

    resultCell.textContent = "Running";



    const repeatCell = document.createElement("td");



    row.appendChild(timeCell);
    row.appendChild(openCell);
    row.appendChild(minuteCell);
    row.appendChild(closeCell);
    row.appendChild(resultCell);
    row.appendChild(repeatCell);

    intervalBody.prepend(row);



    currentInterval.row = row;
    currentInterval.minuteCell = minuteCell;
    currentInterval.closeCell = closeCell;
    currentInterval.resultCell = resultCell;

}



function addMinuteBox(time, price) {

    const color = price >= currentInterval.open ? "green" : "red";

    const box = document.createElement("div");

    box.className = "minute-box " + color;



    box.title = time.toLocaleTimeString() + " — $" + price.toLocaleString();



    box.onclick = () => {

        alert(time.toLocaleTimeString() + "\n$" + price.toLocaleString());

    };



    currentInterval.minuteCell.appendChild(box);

}



function finishInterval() {

    const closePrice = latestPrice;

    currentInterval.closeCell.textContent = "$" + closePrice.toLocaleString();



    const result = closePrice >= currentInterval.open ? "Up" : "Down";

    currentInterval.resultCell.textContent = result;



    const repeatCell = currentInterval.row.children[5];



    if (intervals.length > 0) {

        const prev = intervals[intervals.length - 1];

        if (prev === result) {

            const blue = document.createElement("div");

            blue.className = "minute-box blue";

            repeatCell.appendChild(blue);

        }

    }



    intervals.push(result);



    lastIntervalClose = closePrice;

}



function startMinuteTracking() {

    const now = new Date();

    const delay = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();



    setTimeout(() => {

        recordMinutePrice();

        setInterval(recordMinutePrice, 60000);

    }, delay);

}



fetchPrice();
setInterval(fetchPrice, 20000);

startMinuteTracking();