'use strict'
/*
 * Developed by Addison Rodomista (@rodomeista)
 * February 6th, 2017
 * The purpose of this app is to give a count down timer to a specific subway
 */

/* 
 * NPM packages
 * Enable these imports if running from node server
 */
// var axios 	= require('axios');
// var moment 	= require('moment');


/*
 * Subway Identifier
 * Currently set to Greenpoint G North
 * Full list can be found in ./subway_codes.json
 */
const SUBWAY_ID = "G26N";

/*
 * How often app refreshes. 
 * Defaulted to 30 seconds
 */
const REFRESH_TIMER = 10*1000;

/*
 * How long for app to go to sleep
 */
const SLEEP_TIMER 	= 30*1000;
/*
 * DOM Selectors
 */
let times_first = document.getElementById("subway-times_first");
let times_second = document.getElementById("subway-times_second");
let app_container = document.getElementById("app-container");

/*
 * Primary app timout
 */
let app_timeout;
let app_state = "sleep";
/* 
 * given an array of times, determine the closest one to a specified time 
 * @param {string} current_time
 * @param {array}  arrival_times
 */
function getClosestTime(current_time, arrival_times) {
	let closest = arrival_times[0];
	for(var i = 1; i < arrival_times.length; i++) {
		// If closest time is less than current time, try next one
		if (closest < current_time) closest = arrival_times[i];
		// If the closest number IS the number, return
		if (arrival_times[i] === current_time) {
			closest = current_time;
			return;
		}
		if (arrival_times[i] > current_time && arrival_times[i] < closest) {
			closest = arrival_times[i];
		}
	}
	return closest;
}

/* 
 * Determines how many minutes till next subway
 * @param {string} current_time
 * @param {string} next_time
 */
function getTimeTillNext(current_time, next_time) {
	var data_current 	= moment(current_time, "HH:mm:ss");
	var data_next 		= moment(next_time, "HH:mm:ss");

	var difference = moment(data_next.diff(data_current)).format("mm:ss");;

	return difference;
}

/* 
 * Determines how many minutes till next subway
 */
function getNextSubwayTime() {
	// Get the schedule information
	// TODO: Only update schedule info once a day
	getSubwaySchedule(SUBWAY_ID)
	.then(function(data) {
		// Get just the information for arrivals
		let arrivals = data.data.result.arrivals;
		
		// Get current time
		let now = moment();
		let time = now.format("HH:mm:ss");
		
		// Determine the closest subway time
		let closest = getClosestTime(time, arrivals);
		
		// Get the next subway time
		let time_next = getTimeTillNext(time, closest);

		// Render to the Pi
		renderNext(time_next);
	})
	.catch(function(err) {
		renderError(err);
	})
}

/* 
 * Return the subway schedule given a specified ID
 * @param {string} subway_id
 */
function getSubwaySchedule(subway_id) {
	return axios.get(`http://mtaapi.herokuapp.com/api?id=${subway_id}`)
}

/* 
 * Render the visual to the PI
 * @param {string} time_next
 */
function renderNext(time_next) {
	times_first.innerHTML = formatTextResponse(time_next) + "min";
	console.log(`The next subway is in ${time_next}`)
}

/* 
 * Render the error to the PI
 * @param {string} err
 */
function renderError(err) {
	console.error(data);
}

/* 
 * Remove the seconds from the timed response and any leading 0's
 * @param {string} text
 */
function formatTextResponse(text) {
	// If leading 0, remove it 
	text = text.split(":");
	text = text[0];
	if (text[0] == "0") {
		text = text[1];
	}
	return text;

}


function triggerAnimations() {
	let items = document.querySelectorAll(".app-content_item");
	// Reset the animation state
	resetAnimations();

	// Trigger the animation
	setTimeout(() => {
		for (let num = 0; num < items.length; num++) {
			items[num].className = "app-content_item animate";
		}
	}, 1);
}


function resetAnimations() {
	let items = document.querySelectorAll(".app-content_item");
	for (let num = 0; num < items.length; num++) {
		console.log(num);
		items[num].className = "app-content_item";
	}
}

/* 
 * Bind click events
 */
function bindClickEvents() {
	app_container.onclick = () => {
		if (app_state == "sleep") {
			triggerAnimations();
		}
		resetSleepTimer();
	}	
}


function resetSleepTimer() {
	console.log("timeout cleared");
	setSleepState(false);
	clearTimeout(app_timeout);
	sleepTimer();
}

function sleepTimer() {
	app_timeout = setTimeout(() => {
		setSleepState(true);
	}, SLEEP_TIMER);
}

function goToSleep() {
	clearTimeout(app_timeout);
	setSleepState(true);
	resetAnimations();
}

function setSleepState(_bool) {
	if (_bool) {
		app_container.className = "sleep";
		app_state = "sleep";
		resetAnimations();
	} else {
		app_container.className = "";
		app_state = "active";
	}
}

/* 
 * Main app loop
 */
function loop() {
	getNextSubwayTime();
	setInterval(getNextSubwayTime, REFRESH_TIMER);
}


/* 
 * Start the app
 */
bindClickEvents();
sleepTimer();
loop();




