'use strict';

// prettier-ignore

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');


class WorkOut {
    date = new Date()
    id = (Date.now() + '').slice(5) 
    click = 0;

    constructor(coords, distance, duration, ){
        this.coords = coords // [lat, lng]
        this.distance = distance // in km
        this.duration = duration // in min
    }
    do_click(){
        this.click++
    }

    _setLabelMarker(){
        return `${this.constructor.name} on ${this.date.getMonth} ${this.date.getDate()}`
    }
}


class Running extends WorkOut {
    type = 'running';
    labelMarker = this._setLabelMarker()
    constructor(coords, distance, duration, cadence){
        
        super(coords, distance, duration);
        this.cadence = cadence;
        this.calcPace();
    }

    calcPace(){
        // min/km
        this.pace =  this.duration / this.distance
        return this.pace
    }


}



class Cycling extends WorkOut {
    type = 'cycling';
    labelMarker = this._setLabelMarker()

    constructor(coords, distance, duration, elevationGain){
        super(coords, distance, duration)
        this.elevationGain = elevationGain
        this.calcSpeed()
    }

    calcSpeed(){
        // km/h
        this.speed =  this.distance / (this.duration / 60)
        return this.speed
    }



}


class App {
    #map;
    #mapEvent;
    #workOuts = [];
    #mapZoomLevel = 17;
    constructor(){
        
        this._getLocalStorage()
        this._getPosition();
        form.addEventListener('submit',this._newWorkout.bind(this))   
        inputType.addEventListener('change',this._toggleElevationField)  
        containerWorkouts.addEventListener('click', this._MoveToMarker.bind(this))
    }

    _getPosition(){
        if (navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), ()=>{
                alert("Don't have a geolocation")
            });
        }
    }


    _loadMap(positions){
            const {latitude} = positions.coords
            const {longitude} = positions.coords
            const conrdes = [latitude, longitude]
            this.#map = L.map('map').setView(conrdes, this.#mapZoomLevel);
            L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(this.#map);

            L.marker(conrdes).addTo(this.#map)
            .bindPopup('A pretty CSS popup.<br> Easily customizable.')
            .openPopup();   

            this.#map.on('click',this._showForm.bind(this))

            this.#workOuts.forEach(workout => {
                this._renderWrokOutMarker(workout)
            })

        
    }

    _showForm(mapE){
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _toggleElevationField(e){
        e.preventDefault()
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');  
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    }
    _hideForm(){
        inputDistance.value = inputCadence.value = inputDuration.value = ''
        form.style.display = 'none'
        form.classList.add('hidden')
        setTimeout(()=> form.style.display = 'grid', 500)
    }
    _newWorkout(e){
        e.preventDefault()         
        // Get data from form
        const type = inputType.value
        const distance = +inputDistance.value
        const duration = +inputDuration.value
        const {lat, lng} = this.#mapEvent.latlng

        let workout;
         

        // Check if data is valid 
        const valueIsNumber= function(...inputs){
            // every function return true just if every elements in list is True
            return inputs.every(input => Number.isFinite(input))
        }

        const valueIsPositive = function(...inputs){
            return inputs.every(input=> input > 0)
        }

        // If workout is running create Running object
        if (type === 'running'){
            const cadence = +inputCadence.value
            if (!valueIsNumber(distance, duration, cadence) ||
             !valueIsPositive(distance, duration, cadence)) return alert('Form datas is not correct')
            workout = new Running([lat, lng], distance, duration, cadence) 
            

        }
        // If workout is cycling create Cycling object
        if (type === 'cycling'){
            const elevation = +inputElevation.value
            if (!valueIsNumber(distance, duration, elevation)
             || !valueIsPositive(distance, duration)) return alert('Form datas is not correctl')
            workout = new Cycling([lat, lng], distance, duration, elevation)
            
        }
        // Add new object to workouts list 
        this.#workOuts.push(workout)

        // Render workout on map as marker 
        this._renderWrokOutMarker(workout) 

        // Render workout on list 
        this._renderWrokout(workout)
        // Hide form + cleare input fields data
        this._hideForm()

        // Set local stoage
        this._setLocalStorage()
    }

    _renderWrokOutMarker(workout){
        const popup = L.popup({maxWidth:300, minWith:100, 
            autoClose:false,
             closeOnClick:false,
             className:`${workout.type}-popup`,
            }).setContent(workout.type.toUpperCase()[0]+ workout.type.slice(1,) + ' workout')    
        L.marker(workout.coords).addTo(this.#map).bindPopup(popup).openPopup()
    }

    _renderWrokout(workout){

        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
                    <h2 class="workout__title">${workout.labelMarker}</h2>
                    <div class="workout__details">
                    <span class="workout__icon">🏃‍♂️</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                    </div>
                    <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                    </div>`

        if (workout.type === 'running'){
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div> </li>`
        }
        if (workout.type === 'cycling'){
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li> `
        }


        form.insertAdjacentHTML('afterend', html)

    }

    _MoveToMarker(e){
        const workoutEl = e.target.closest('.workout')
        console.log(workoutEl);

        if (!workoutEl) return

        const workout = this.#workOuts.find(workout => workout.id === workoutEl.dataset.id)
        console.log(workout);
        
        this.#map.setView(workout.coords, this.#mapZoomLevel, {
            animate: true,
            pan: {
                duration:1,
            }
        })

        // workout.do_click()   
    }       

    _setLocalStorage(){
        localStorage.setItem('workouts', JSON.stringify(this.#workOuts))
    }

    _getLocalStorage(){
        const workouts = localStorage.getItem('workouts')

        if (!workouts) return
        this.#workOuts = JSON.parse(workouts)
        this.#workOuts.forEach(workout => {
            this._renderWrokout(workout)
        });
        console.log(workouts); 
    }

    reset(){
        localStorage.removeItem('workouts');
        location.reload();
    }
}

const app = new App()
    