'use strict';

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
// let map, mapEvent;

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
    #bindClosePopup = this._closePopup.bind(this);
    #icon = L.icon({
        iconUrl: './icon.png',
        iconSize: [35, 40], // size of the icon
        popupAnchor: [0, -20], // point from which the popup should open relative to the iconAnchor
    });
    #icons = {
        running: '🏃‍♂️',
        cycling: '🚴‍♀️',
    };
    #map;
    #mapEvent;
    #mapZoomLevel = 18;
    #workouts = [];
    #userCords;
    constructor() {
        // Get user's position
        this._getPosition();
        // // Get data from local storage
        // Attach  event handlers
        form.addEventListener('keydown', this._newWorkOut.bind(this));
        inputType.addEventListener('change', this._toggleElevationField);
        containerWorkouts.addEventListener(
            'click',
            this._moveMarkerToMap.bind(this)
        );
    }
    _getPosition() {
        navigator.geolocation.getCurrentPosition(
            this._loadMap.bind(this),
            function () {
                // if there is error pop it to the user
                this._pushPopup(
                    'failed',
                    "Couldn't your location please check your location settings and try again"
                );
            }.bind(this)
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
        currentLocationBtn.addEventListener(
            'click',
            this._GetCurrentPosition.bind(this, this.#userCords, true)
        );
        //put current position of the user on the map
        this._drawCircle(this.#userCords);
        // handling clicks on map
        this.#map.on('click', this._showForm.bind(this));
        // Get data from local storage
        this._loadDataFromLocalStorage();
        // Update workouts array;
        this._buildClassBasedLocalStorage();
    }
    _showForm(e) {
        form.classList.remove('hidden');
        // inputDistance.focus();
        this.#mapEvent = e || this.#mapEvent;
        if (form.classList.contains('update')) {
            form.classList.remove('update');
            this._removeActiveUpdateButtons();
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
                `${this.#icons[`${workout.type}`]} ${formatText(
                    workout.type
                )} on ${workout.date}`
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
                this.#icons[`${workout.type}`]
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
        const keys = ['enter', 'return', 'done'];
        if (!keys.includes(e.key.toLowerCase())) return;
        e.preventDefault();
        if (form.classList.contains('update')) {
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
        // check if running or cycling
        if (type === 'running') {
            const cadence = +inputCadence.value;
            // check if data is valid
            if (!this._validateInputs(distance, duration, cadence))
                return this._pushPopup(
                    'failed',
                    'Inputs have to be positive numbers!'
                );
            // create Running object
            workout = new Running(cords, distance, duration, cadence);
        }
        if (type === 'cycling') {
            const elevation = +inputElevation.value;
            // check if data is valid
            if (!Number.isFinite(elevation) || elevation == 0)
                return this._pushPopup('failed', 'Input have to be number!');
            if (!this._validateInputs(distance, duration))
                return this._pushPopup(
                    'failed',
                    'Inputs have to be positive numbers!'
                );
            // create Cycling object
            workout = new Cycling(cords, distance, duration, elevation);
        }
        // push workout to workouts array
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
        const target = e.target.closest('.workout');
        if (!target) return;
        // Get clicked workout index
        const index = this._getWorkoutIndex(target);
        // Get the workout
        const workout = this.#workouts[index];
        const checkButton = e.target.closest('.btn-delete');
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
        this._GetCurrentPosition(workout.cords);
    }
    _setLocalStorage() {
        window.localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }
    _loadDataFromLocalStorage() {
        const workouts = JSON.parse(window.localStorage.getItem('workouts'));
        if (workouts) {
            this.#workouts = workouts;
            workouts.forEach(el => {
                // build label foreach workout in navbar
                this._renderWorkoutData(el);
                // put marker foreach workout in the map
                this._renderWorkoutMaker(el);
            });
        }
        //adjust viewport
        if (this.#workouts.length > 1) this._checkView();
    }
    _updateWorkout(e) {
        e.addEventListener('click', () => {
            if (form.classList.contains('update')) {
                this._removeActiveUpdateButtons();
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
        });
    }
    _getInnerHtml(selector, element) {
        selector = selector || document;
        return selector.querySelector(`${element}`).innerHTML;
    }
    _removeActiveUpdateButtons() {
        document.querySelectorAll('.btn-edit').forEach(el => {
            el.querySelector('.editing').style.display = 'none';
            el.querySelector('.edit').style.display = 'block';
            el.classList.remove('selected-btn');
            el.classList.add('default-btn');
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
                return this._pushPopup(
                    'failed',
                    'Inputs have to be positive numbers!'
                );
        }
        if (type === 'cycling') {
            elevation = +inputElevation.value;
            // check if data is valid
            if (!Number.isFinite(elevation) || elevation == 0)
                return this._pushPopup(
                    'failed',
                    'Input have to be positive number!'
                );
            if (!this._validateInputs(distance, duration))
                return this._pushPopup(
                    'failed',
                    'Inputs have to be positive numbers!'
                );
            // return alert('Inputs have to be positive numbers!');
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
        //push data to local storage
        this._setLocalStorage();
        // Update UI
        this._hideForm();
        this._clearDataFromForm();
        form.classList.remove('update');
        currentLI.querySelector('#duration').innerHTML = duration;
        currentLI.querySelector('#distance').innerHTML = distance;
        this._removeActiveUpdateButtons();
        this._pushPopup('success', 'Workout updated successfully');
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
        const first = this._findMin();
        const sec = this._findMax();
        const final = this._midpoint(first, sec);
        this.#map.setView(final, zoomLevel);
    }
    _checkView() {
        let zoomLevel = --this.#mapZoomLevel;
        // Get min cords workout in viewport of the map
        const one = this.#map.getBounds().contains(this._findMin());
        // Get max cords workout in viewport of the map
        const two = this.#map.getBounds().contains(this._findMax());
        // Check if min and max cords in viewport if no adjust viewport and check again
        if (!one || !two) {
            this._viewPort(--zoomLevel);
            setTimeout(() => {
                this._checkView();
            }, 500);
        }
    }
    _GetCurrentPosition(cords, myLocation = false) {
        // Get center of current viewport
        const currentCords = [
            this.#map.getCenter().lat,
            this.#map.getCenter().lng,
        ];
        if (
            Math.abs(this.#map.getCenter().lat - cords[0]) >= 0.00001 &&
            Math.abs(this.#map.getCenter().lng - cords[1]) >= 0.00001
        ) {
            if (
                Math.abs(this.#map.getCenter().lat - cords[0]) >= 0.005 ||
                Math.abs(this.#map.getCenter().lng - cords[1]) >= 0.005
            ) {
                // move to this cords
                this.#map.flyTo(cords, 16.5, {
                    animate: true,
                    duration: 1.5,
                });
            } else {
                this.#map.flyTo(cords, 16.5, {
                    animate: true,
                    duration: 0.5,
                });
            }
        }
    }
    _drawCircle(cords) {
        L.circle(cords, { radius: 2, weight: 10 }).addTo(this.#map);
        L.circle(cords, {
            radius: 75,
            fillOpacity: 0.15,
            weight: 0.5,
        }).addTo(this.#map);
    }
    _pushPopup(stat, message) {
        textAnn.innerHTML = message;
        status.innerHTML = formatText(stat);
        icon.innerHTML = stat == 'success' ? success : failed;
        const color = stat == 'success' ? '#2196f3' : '#ff3821';
        document.documentElement.style.setProperty('--pop', `${color}`);
        popup.classList.add('active');
        document.addEventListener('click', this.#bindClosePopup);
    }

    _closePopup(e) {
        const check = e.target.closest('.popup');
        if (!check) {
            popup.classList.remove('active');
            document.removeEventListener('click', this.#bindClosePopup); // when it done clear it
        }
    }
}
const app = new App();
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
