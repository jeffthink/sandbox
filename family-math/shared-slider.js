// Shared Family Size Slider Component
class FamilySizeSlider {
    constructor(containerId, initialValue = 4, onChange = null) {
        this.containerId = containerId;
        this.value = initialValue;
        this.onChange = onChange;
        this.callbacks = [];
        this.init();
    }

    init() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID '${this.containerId}' not found`);
            return;
        }

        container.innerHTML = `
            <div class="slider-container">
                <label class="slider-label">Family Size:</label>
                <input type="range" min="2" max="8" value="${this.value}" id="familySlider">
                <span class="family-size" id="familySize">${this.value}</span>
            </div>
        `;

        this.slider = document.getElementById('familySlider');
        this.display = document.getElementById('familySize');

        this.slider.addEventListener('input', () => {
            this.value = parseInt(this.slider.value);
            this.display.textContent = this.value;
            this.notifyChange();
        });

        this.slider.addEventListener('change', () => {
            this.value = parseInt(this.slider.value);
            this.display.textContent = this.value;
            this.notifyChange();
        });
    }

    notifyChange() {
        if (this.onChange) {
            this.onChange(this.value);
        }
        this.callbacks.forEach(callback => callback(this.value));
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    setValue(newValue) {
        this.value = newValue;
        if (this.slider) {
            this.slider.value = newValue;
            this.display.textContent = newValue;
        }
    }

    getValue() {
        return this.value;
    }
}

// Export for use in other files
window.FamilySizeSlider = FamilySizeSlider;