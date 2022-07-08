'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
const deleteBtn = document.querySelector('.btn-delete');
const editBtn = document.querySelector('.btn-edit');
const currentLocationBtn = document.querySelector('.currentLocation');
let map, mapEvent;
const icons = {
    running: '🏃‍♂️',
    cycling: '🚴‍♀️',
};
const getDate = () => {
    const date = new Date();
    const dateOptions = {
        month: 'long',
        day: 'numeric',
    };
    const current = new Intl.DateTimeFormat(
        navigator.language,
        dateOptions
    ).format(date);
    return current;
};
const formatText = text => {
    return text[0].toUpperCase() + text.slice(1);
};
class App {
    #map;
    #mapEvent;
    #mapZoomLevel = 18;
    #workouts = [];
    #userCords;
    #icon = L.icon({
        iconUrl: './icon.png',
        iconSize: [35, 40], // size of the icon
        popupAnchor: [0, -20], // point from which the popup should open relative to the iconAnchor
    });
    #oldButtonData;
    constructor() {
        // Get user's position
        this._getPosition();
        // // Get data from local storage
        // setTimeout(() => {
        //     this._loadDataFromLocalStorage();
        // }, 1000);
        // this.#map.addEventListener('load', () => console.log(12121212));
        //delete button
        // deleteBtn.addEventListener('click', e => {
        // const tt = e.target;
        // console.log(tt);
        // if (tt) {
        // containerWorkouts.removeEventListener(
        // 'click',
        // this._moveMarkerToMap.bind(this)
        // );
        // }
        // });
        // Attach  event handlers
        form.addEventListener('keydown', this._newWorkOut.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener(
            'click',
            this._moveMarkerToMap.bind(this)
        );
        // containerWorkouts.removeEventListener('click', this._moveMarkerToMap);
        // map = 1;
    }
    _getPosition() {
        navigator.geolocation.getCurrentPosition(
            this._loadMap.bind(this),
            function () {
                alert('Could not get your location');
            }
        );
    }
    _loadMap(position) {
        const { latitude, longitude } = position.coords;
        const cords = [latitude, longitude];
        this.#userCords = cords;
        this.#map = L.map('map').setView(cords, this.#mapZoomLevel);
        L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(this.#map);
        map = this.#map;
        currentLocationBtn.addEventListener(
            'click',
            this._GetCurrentPosition.bind(this, this.#userCords)
        );
        // handling clicks on map
        this.#map.on('click', this._showForm.bind(this));
        document.querySelector('#map').addEventListener('click', this._test);
        // Get data from local storage
        this._loadDataFromLocalStorage();
        // Update workouts array;
        this._buildClassBasedLocalStorage();
        // Put Get Current location button on map
        // this._putFixedButton();
    }
    _showForm(e) {
        // console.log(e.target);
        // if (e.target) return;
        form.classList.remove('hidden');
        // inputDistance.focus();
        this.#mapEvent = e || this.#mapEvent;
        if (form.classList.contains('update')) {
            form.classList.remove('update');
            this._removeUpdateButtons();
            // Clear old data from form
            this._clearDataFromForm();
        }
    }
    _clearDataFromForm() {
        // Clear data from form
        // prettier-ignore
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        // set workout default;
        if (inputType.value !== 'running') {
            inputType.value = 'running';
            this._toggleElevationField();
        }
    }
    _hideForm() {
        //Hide Form;
        form.style.display = 'none';
        form.classList.add('hidden');
        setTimeout(() => (form.style.display = 'grid'));
    }
    _toggleElevationField() {
        inputCadence
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
        inputElevation
            .closest('.form__row')
            .classList.toggle('form__row--hidden');
    }
    _validateInputs(...arr) {
        return arr.every(i => i > 0 && Number.isFinite(i));
    }
    _renderWorkoutMaker(workout) {
        //put mark
        L.marker(workout.cords, { icon: this.#icon })
            .addTo(this.#map)
            .bindPopup(
                L.popup({
                    maxWidth: 200,
                    minWidth: 150,
                    autoClose: false,
                    closeOnClick: false,
                    className: `${workout.type}-popup`,
                })
            )
            .setPopupContent(
                `${icons[`${workout.type}`]} ${formatText(workout.type)} on ${
                    workout.date
                }`
            )
            .openPopup();
    }
    _renderWorkoutData(workout) {
        const data = document.createElement('li');
        data.dataset.id = workout.id;
        data.classList = `workout workout--${workout.type}`;
        data.innerHTML = `
        <div class="title">
        <h2 class="workout__title" id="workout-heading">${formatText(
            workout.type
        )} on ${workout.date}</h2>
        <button class="btn btn-delete">
        <i class="fa-solid fa-trash delete"></i>
        <i class="fa-solid fa-trash-arrow-up deleted"></i>
        </button>
        <button class="btn btn-edit">
        <i class="fa-solid fa-pen edit"></i>
        <i class="fa-solid fa-user-pen editing"></i>
        </button>
        </div>
        <div class="workout__details">
            <span class="workout__icon" id='workout-symbol'>${
                icons[`${workout.type}`]
            }</span>
            <span class="workout__value" id='distance'>${
                workout.distance
            }</span>
            <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value" id='duration'>${
                workout.duration
            }</span>
            <span class="workout__unit">min</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value" id='speed'>${
                workout.type === 'running' ? workout.pace : workout.speed
            }</span>
            <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
            <span class="workout__icon" id='up-or-down'>${
                workout.type === 'running' ? '🦶🏼' : '⛰'
            }</span>
            <span class="workout__value" id='calculated'>${
                workout.type === 'running' ? workout.cadence : workout.elevation
            }</span>
            <span class="workout__unit" id="unit">${
                workout.type === 'running' ? 'spm' : 'm'
            }</span>
        </div>
        `;
        this._updateWorkout(data.querySelector('.btn-edit'));
        this.#oldButtonData = data.querySelector('.btn-edit').innerHTML;
        form.insertAdjacentElement('afterend', data);
    }
    _removeMarker(cords) {
        const layers = this.#map._layers;
        for (const layer in layers) {
            if (layers[layer]._latlng === undefined) continue;
            else {
                const { lat, lng } = layers[layer]._latlng;
                if (cords[0] == lat && cords[1] == lng)
                    this.#map.removeLayer(layers[layer]);
            }
        }
    }
    _newWorkOut(e) {
        const keys = ['enter', 'return'];
        if (!keys.includes(e.key.toLowerCase())) return;
        e.preventDefault();

        if (form.classList.contains('update')) {
            // inputDistance.addEventListener('ke')
            this._updateWorkoutData();
            return;
        }
        // Get cords
        const cords = [this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng];
        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;
        console.log(distance, duration);
        // check if running or cycling
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // check if data is valid
            if (!this._validateInputs(distance, duration, cadence))
                return alert('Inputs have to be positive numbers!');
            // create Running object
            workout = new Running(cords, distance, duration, cadence);
        }
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            // check if data is valid
            if (!Number.isFinite(elevation) || elevation == 0)
                return alert('Input have to be numbers!');
            if (!this._validateInputs(distance, duration))
                return alert('Inputs have to be positive numbers!');
            // create Cycling object
            workout = new Cycling(cords, distance, duration, elevation);
        }
        // push workout to workouts global array
        console.log(this.#workouts);
        this.#workouts.push(workout);
        //push data to local storage
        this._setLocalStorage();
        //render workout on the map as marker
        this._renderWorkoutMaker(workout);
        //render workout data in the container
        this._renderWorkoutData(workout);
        // Update UI
        this._hideForm();
        this._clearDataFromForm();
    }
    _getWorkoutIndex(target) {
        return this.#workouts.findIndex(s => s.id === +target.dataset.id);
    }
    _moveMarkerToMap(e) {
        console.log('up');

        // console.log(e.target.dataset.id);
        console.log(e.target);
        t2 = e.target;
        const target = e.target.closest('.workout');
        console.log(target);
        if (!target) return;
        // Get clicked workout index
        const index = this._getWorkoutIndex(target);
        // Get the workout
        const workout = this.#workouts[index];
        const checkButton = e.target.closest('.btn-delete');
        // console.log(checkButton);
        if (checkButton) {
            // Remove Workout details from the page
            containerWorkouts.removeChild(target);
            // Delete workout from workouts array
            this.#workouts.splice(index, 1);
            // Delete workout from local storage
            this._setLocalStorage();
            // Remove marker from map
            this._removeMarker(workout.cords);
            return;
        }
        // console.log(checkButton);
        // console.log(target);
        // if (e.target.nodeName === 'LI') {
        // const index = this.#workouts.findIndex(
        //     s => s.id === +target.dataset.id
        // );
        console.log('end');
        // t1 = workout;
        // console.log(workout);
        // console.log()
        // console.log(1);
        // console.log(this.#workouts);
        // map('map').setView(workout.cords, 18);
        // this.#map.setView(workout.cords, this.#mapZoomLevel, {
        //     animate: true,
        //     pan: {
        //         duration: 2,
        //     },
        // });
        // this.#map.flyTo(workout.cords, 17, {
        //     animate: true,
        //     duration: 1.5,
        // });
        this._GetCurrentPosition(workout.cords);

        // }
    }
    _setLocalStorage() {
        window.localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _loadDataFromLocalStorage() {
        const workouts = JSON.parse(window.localStorage.getItem('workouts'));
        t1 = workouts;
        if (workouts) {
            this.#workouts = workouts;
            console.log(workouts);
            workouts.forEach(el => {
                this._renderWorkoutData(el);
                this._renderWorkoutMaker(el);
            });
        }
        //adjust viewport
        if (this.#workouts.length > 1) this._checkView();
        // this._viewPort(--this.#mapZoomLevel);
    }
    _updateWorkout(e) {
        e.addEventListener('click', () => {
            if (form.classList.contains('update')) {
                this._removeUpdateButtons();
                if (
                    e.parentElement.parentElement.dataset.id === form.dataset.id
                ) {
                    //Hide Form;
                    form.classList.add('hidden');
                    // Clear data from form
                    // prettier-ignore
                    inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
                    form.classList.remove('update');
                    return;
                }
            }
            this._showForm();
            console.log('continued');
            // inputType.value =
            // e.innerHTML = '<i class="fa-solid fa-user-pen"></i>';
            e.querySelector('.editing').style.display = 'block';
            e.querySelector('.edit').style.display = 'none';
            e.classList.add('selected-btn');
            form.classList.add('update');
            const target = e.parentElement.parentElement;
            inputDistance.value = this._getInnerHtml(target, '#distance');
            inputDuration.value = this._getInnerHtml(target, '#duration');
            form.dataset.id = target.dataset.id;
            if (target.classList.contains('workout--running')) {
                if (inputType.value !== 'running') {
                    console.log(1);
                    inputType.value = 'running';
                    this._toggleElevationField();
                }
                inputCadence.value = this._getInnerHtml(target, '#calculated');
            } else {
                if (inputType.value === 'running') {
                    inputType.value = 'cycling';
                    this._toggleElevationField();
                }
                inputElevation.value = this._getInnerHtml(
                    target,
                    '#calculated'
                );
            }
            console.log(1);
            console.log(target.dataset.id);
            console.log(form.dataset.id);
            // Get data from form
            // const type = inputType.value;
            // const distance = +inputDistance.value;
            // const duration = +inputDuration.value;
        });
    }
    _getInnerHtml(selector, element) {
        selector = selector || document;
        return selector.querySelector(`${element}`).innerHTML;
    }
    _removeUpdateButtons() {
        document.querySelectorAll('.btn-edit').forEach(el => {
            // el.innerHTML = this.#oldButtonData;
            el.querySelector('.editing').style.display = 'block';
            el.querySelector('.edit').style.display = 'none';
            el.classList.remove('selected-btn');
            el.classList.add('default-btn');
            // el.style.backgroundColor = 'transparent';
        });
    }
    _updateWorkoutData() {
        // Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let elevation, cadence;
        // checkInputs
        if (type === 'running') {
            cadence = +inputCadence.value;
            // check if data is valid
            if (!this._validateInputs(distance, duration, cadence))
                return alert('Inputs have to be positive numbers!');
        }
        if (type === 'cycling') {
            elevation = +inputElevation.value;
            // check if data is valid
            if (!Number.isFinite(elevation) || elevation == 0)
                return alert('Input have to be numbers!');
            if (!this._validateInputs(distance, duration))
                return alert('Inputs have to be positive numbers!');
        }
        // Get clicked workout index
        const index = this._getWorkoutIndex(form);
        // old data
        const oldDate = this.#workouts[index].date;
        const oldCords = this.#workouts[index].cords;
        // Get current workout label
        const currentLI = document.querySelector(
            `li[data-id="${form.dataset.id}"]`
        );
        //check if type changed
        if (type != this.#workouts[index].type) {
            if (type == 'running') {
                this.#workouts[index] = new Running();
                currentLI.querySelector('#workout-symbol').innerHTML = '🏃‍♂️';
                currentLI.querySelector('#unit').innerHTML = 'spm';
                currentLI.querySelector('#up-or-down').innerHTML = '🦶🏼';
                currentLI.classList.remove('workout--cycling');
                currentLI.classList.add('workout--running');
            } else {
                this.#workouts[index] = new Cycling();
                currentLI.querySelector('#workout-symbol').innerHTML = '🚴‍♀️';
                currentLI.querySelector('#unit').innerHTML = 'm';
                currentLI.querySelector('#up-or-down').innerHTML = '⛰';
                currentLI.classList.add('workout--cycling');
                currentLI.classList.remove('workout--running');
            }
            currentLI.querySelector(
                '#workout-heading'
            ).innerHTML = `${formatText(type)} on ${oldDate}`;
            this.#workouts[index].id = +form.dataset.id;
            this.#workouts[index].date = oldDate;
            this.#workouts[index].cords = oldCords;
            // Remove Old Marker
            this._removeMarker(oldCords);
            // Add new marker
            this._renderWorkoutMaker(this.#workouts[index]);
        }
        this.#workouts[index].type = type;
        this.#workouts[index].distance = distance;
        this.#workouts[index].duration = duration;

        if (type === 'running') {
            this.#workouts[index].cadence = cadence;
            console.log(cadence);
            console.log(currentLI.querySelector('#calculated').innerHTML);
            currentLI.querySelector('#calculated').innerHTML = cadence;
            this.#workouts[index].pace = this.#workouts[index].calcPace();
            currentLI.querySelector('#speed').innerHTML =
                this.#workouts[index].pace;
        }
        if (type === 'cycling') {
            this.#workouts[index].elevation = elevation;
            this.#workouts[index].speed = this.#workouts[index].calcSpeed();
            currentLI.querySelector('#calculated').innerHTML = elevation;
            currentLI.querySelector('#speed').innerHTML =
                this.#workouts[index].speed;
        }
        t2 = this.#workouts;
        //push data to local storage
        this._setLocalStorage();
        // Update UI
        this._hideForm();
        this._clearDataFromForm();
        form.classList.remove('update');
        currentLI.querySelector('#duration').innerHTML = duration;
        currentLI.querySelector('#distance').innerHTML = distance;
        this._removeUpdateButtons();
    }
    _buildClassBasedLocalStorage() {
        if (window.localStorage.getItem('workouts')) {
            this.#workouts.forEach((e, i) => {
                if (e.type === 'running') {
                    const newWorkout = new Running(
                        e.cords,
                        e.distance,
                        e.duration,
                        e.cadence,
                        e.id
                    );
                    newWorkout.date = this.#workouts[i].date;
                    this.#workouts[i] = newWorkout;
                } else {
                    const newWorkout = new Cycling(
                        e.cords,
                        e.distance,
                        e.duration,
                        e.elevation,
                        e.id
                    );
                    newWorkout.date = this.#workouts[i].date;
                    this.#workouts[i] = newWorkout;
                }
            });
        }
    }
    _findMin() {
        let min = 9999999;
        let element;
        this.#workouts.forEach(el => {
            if (el.cords[0] + el.cords[1] < min) {
                min = el.cords[0] + el.cords[1];
                element = el;
            }
        });
        console.log(element);
        return element.cords;
    }
    _findMax() {
        let max = -1;
        let element;
        this.#workouts.forEach(el => {
            if (el.cords[0] + el.cords[1] > max) {
                max = el.cords[0] + el.cords[1];
                element = el;
            }
        });
        return element.cords;
    }
    _midpoint(arr1, arr2) {
        return [
            Math.abs(arr1[0] + arr2[0]) / 2,
            Math.abs(arr1[1] + arr2[1]) / 2,
        ];
    }
    _viewPort(zoomLevel) {
        // if (cords) this.#map.setView(cords, zoomLevel);
        const first = this._findMin();
        const sec = this._findMax();
        const final = this._midpoint(first, sec);
        this.#map.setView(final, zoomLevel);
    }
    _checkView() {
        let zoomLevel = --this.#mapZoomLevel;
        // zoomLevel--;
        // Get min cords workout in viewport of the map
        const one = this.#map.getBounds().contains(this._findMin());
        // Get max cords workout in viewport of the map
        const two = this.#map.getBounds().contains(this._findMax());
        // Check if min and max cords in viewport if no adjust viewport and check again
        if (!one || !two) {
            this._viewPort(--zoomLevel);
            this._checkView();
        }
    }
    _getCorner() {
        const latlng = L.marker(map.getBounds().getSouthEast())._latlng;
        const cords = [latlng.lat + 0.02, latlng.lng + 0.02];
        L.marker(cords)
            .addTo(map)
            .bindPopup('A pretty CSS3 popup.<br> Easily customizable.');
    }
    _GetCurrentPosition(cords) {
        // return;
        const currentCords = [
            this.#map.getCenter().lat,
            this.#map.getCenter().lng,
        ];
        console.log(currentCords, cords);
        if (
            this.#map.getCenter().lat != cords[0] &&
            this.#map.getCenter().lng != cords[1]
        ) {
            this.#map.flyTo(cords, 16.5, {
                animate: true,
                duration: 1.5,
            });
            // var myRenderer = L.canvas({ padding: 0 });
            // var circleMarker = L.circleMarker(cords, {
            //     renderer: myRenderer,
            //     color: '#3388ff',
            // }).addTo(this.#map);
            const circle = L.circle(cords, {
                radius: 75,
                fillOpacity: 0.15,
                weight: 0.5,
                // lineCap: 'butt',
                // lineJoin: 'none',
                // border: 'none',
            }).addTo(this.#map);
            const dot = L.circle(cords, { radius: 2, weight: 10 }).addTo(
                this.#map
            );
            // // this.#map.fitBounds(circle.getBounds());
            // L.marker(cords, {
            //     icon: L.icon({
            //         iconUrl: '*',
            //         iconSize: [35, 40], // size of the icon
            //         popupAnchor: [0, -20], // point from which the popup should open relative to the iconAnchor
            //     }),
            // }).addTo(this.#map);
        }
        //     .bindPopup(
        //         L.popup({
        //             maxWidth: 200,
        //             minWidth: 150,
        //             autoClose: false,
        //             closeOnClick: false,
        //         })
        //     )
        // //     .setPopupContent(`test`)
        //     .openPopup();
        // this.#map.setView(this.#userCords, 17);
    }
}
let t1, t2;
const app = new App();

// app._getPosition();
// let allCords = [];
// if (navigator.geolocation)
//     navigator.geolocation.getCurrentPosition(
//         function (position) {
//             const { latitude, longitude } = position.coords;
//             // const longitude = position.coords.longitude;
//             const location = `https://www.google.com/maps/@${latitude},${longitude},15z`;
//             console.log(latitude, longitude);
//             console.log(location);

//             const cords = [latitude, longitude];
//             map = L.map('map').setView(cords, 18);
//             L.tileLayer(
//                 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
//                 {
//                     attribution:
//                         '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
//                 }
//             ).addTo(map);

//             L.marker(cords)
//                 .addTo(map)
//                 .bindPopup('A pretty CSS3 popup.<br> Easily customizable.')
//                 .openPopup();
//             // console.log(map);

//             // handling clicks on map
//             map.on('click', function (e) {
//                 console.log(map);
//                 console.log(e);
//                 form.classList.remove('hidden');
//                 inputDistance.focus();
//                 mapEvent = e;

//                 // console.log(1);
//                 // const cords = [e.latlng.lat, e.latlng.lng];
//                 // if (!allCords.includes(cords)) {
//                 //     L.marker(cords)
//                 //         .addTo(map)
//                 //         .bindPopup(
//                 //             L.popup({
//                 //                 maxWidth: 250,
//                 //                 minWidth: 100,
//                 //                 autoClose: false,
//                 //                 closeOnClick: false,
//                 //                 className: 'running-popup',
//                 //             })
//                 //         )
//                 //         .setPopupContent('Workout')
//                 //         .openPopup();
//                 //     allCords.push(cords);
//                 //     console.log(allCords);
//                 // return;
//                 // }
//                 // console.log(1);
//             });
//         },
//         function () {
//             alert('Could not get your location');
//         }
//     );
// const place = document.getElementById('map');
// // place.addEventListener('click', e => {
// //     console.log(e.target);
// //     // console.log(e.target);
// //     if (
// //         e.target.nodeName === 'IMG' ||
// //         e.target.classList.includes('leaflet-popup')
// //     )
// //         e.target.style.display = 'none';
// // });
// const getDate = () => {
//     const date = new Date();
//     const dateOptions = {
//         month: 'long',
//         day: 'numeric',
//     };
//     const d = new Intl.DateTimeFormat(navigator.language, dateOptions).format(
//         date
//     );
//     console.log(d);
//     return d;
// };
// const formatText = text => {
//     return text[0].toUpperCase() + text.slice(1);
// };
// const icons = {
//     running: '🏃‍♂️',
//     cycling: '🚴‍♀️',
// };
// const setData = () => {
//     const type = inputType.value;
//     const data = document.createElement('li');
//     data.classList = `workout workout--${type}`;
//     data.innerHTML = `
//     <h2 class="workout__title">${formatText(type)} on ${getDate()}</h2>
//     <div class="workout__details">
//         <span class="workout__icon">${icons[`${type}`]}</span>
//         <span class="workout__value">${inputDistance.value}</span>
//         <span class="workout__unit">km</span>
//     </div>
//     <div class="workout__details">
//         <span class="workout__icon">⏱</span>
//         <span class="workout__value">${inputDuration.value}</span>
//         <span class="workout__unit">min</span>
//     </div>
//     <div class="workout__details">
//         <span class="workout__icon">⚡️</span>
//         <span class="workout__value">${(
//             inputDistance.value /
//             (inputDuration.value / 60)
//         ).toFixed(2)}</span>
//         <span class="workout__unit">km/h</span>
//     </div>
//     <div class="workout__details">
//         <span class="workout__icon">${type === 'running' ? '🦶🏼' : '⛰'}</span>
//         <span class="workout__value">${
//             type === 'running' ? inputCadence.value : inputElevation.value
//         }</span>
//         <span class="workout__unit">${type === 'running' ? 'spm' : 'm'}</span>
//     </div>
//     `;
//     containerWorkouts.appendChild(data);
// };
// form.addEventListener('submit', function (e) {
//     e.preventDefault();
//     const cords = [mapEvent.latlng.lat, mapEvent.latlng.lng];

//     L.marker(cords)
//         .addTo(map)
//         .bindPopup(
//             L.popup({
//                 maxWidth: 250,
//                 minWidth: 100,
//                 autoClose: false,
//                 closeOnClick: false,
//                 className: `${inputType.value}-popup`,
//             })
//         )
//         .setPopupContent(
//             `${icons[`${inputType.value}`]} ${formatText(
//                 inputType.value
//             )} on ${getDate()}`
//         )
//         .openPopup();
//     setData();
//     // Update UI
//     //Hide Form;
//     form.classList.add('hidden');
//     console.log(allCords);
//     // Clear data from form
//     inputDistance.value =
//         inputCadence.value =
//         inputDuration.value =
//         inputElevation.value =
//             '';
// });
// // let types = inputType.querySelectorAll('option');
// // types.forEach(el => {
// // el.addEventListener('click', () => {
// // console.log(1);
// // console.log(e.target.nodeName);
// // console.log(e.target);
// // if (e.target.nodeName === 'OPTION') console.log(e.target);
// // });
// // });

// // const slider = document.querySelector('.sidebar');
// inputType.addEventListener('change', () => {
//     inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
//     inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
//     // console.log(e.target.nodeName);
//     // console.log(e.target);
//     // if (e.target.nodeName === 'OPTION') console.log(e.target);
// });
// const setData = () => {
//     const type = inputType.value;
//     const data = document.createElement('li');
//     data.classList = `workout workout--${type}`;
//     data.innerHTML = `
//     <h2 class="workout__title">${formatText(type)} on ${getDate()}</h2>
//     <div class="workout__details">
//         <span class="workout__icon">${icons[`${type}`]}</span>
//         <span class="workout__value">${inputDistance.value}</span>
//         <span class="workout__unit">km</span>
//     </div>
//     <div class="workout__details">
//         <span class="workout__icon">⏱</span>
//         <span class="workout__value">${inputDuration.value}</span>
//         <span class="workout__unit">min</span>
//     </div>
//     <div class="workout__details">
//         <span class="workout__icon">⚡️</span>
//         <span class="workout__value">${(
//             inputDistance.value /
//             (inputDuration.value / 60)
//         ).toFixed(2)}</span>
//         <span class="workout__unit">km/h</span>
//     </div>
//     <div class="workout__details">
//         <span class="workout__icon">${type === 'running' ? '🦶🏼' : '⛰'}</span>
//         <span class="workout__value">${
//             type === 'running' ? inputCadence.value : inputElevation.value
//         }</span>
//         <span class="workout__unit">${type === 'running' ? 'spm' : 'm'}</span>
//     </div>
//     `;
//     containerWorkouts.appendChild(data);
// };
class Workout {
    date = getDate();
    constructor(cords, distance, duration, id = +Date.now()) {
        this.cords = cords;
        this.distance = distance; // in Km
        this.duration = duration; // in min
        this.id = id;
    }
}
class Running extends Workout {
    type = 'running';
    constructor(cords, distance, duration, cadence, id) {
        super(cords, distance, duration, id);
        this.cadence = cadence;
        this.pace = this.calcPace();
    }
    calcPace() {
        // min/km
        return (this.duration / this.distance).toFixed(2);
    }
}
class Cycling extends Workout {
    type = 'cycling';
    constructor(cords, distance, duration, elevation, id) {
        super(cords, distance, duration, id);
        this.elevation = elevation;
        this.speed = this.calcSpeed();
    }
    calcSpeed() {
        // km/h
        return (this.distance / (this.duration / 60)).toFixed(2);
    }
}
// const newss = new workout();
const run1 = new Running();
