class MouseInput {
	constructor(element) {
		this.element = element;

		this.isDragging = false;
		this.lastX = 0;
		this.lastY = 0;
		this.deltaX = 0;
		this.deltaY = 0;

		this._registerEvents();
	}

	_registerEvents() {
		this.element.addEventListener('mousedown', this._onMouseDown.bind(this));
		this.element.addEventListener('mousemove', this._onMouseMove.bind(this));
		this.element.addEventListener('mouseup', this._onMouseUp.bind(this));
		this.element.addEventListener('mouseleave', this._onMouseLeave.bind(this));
	}

	_onMouseDown(event) {
		this.isDragging = true;
		this.lastX = event.clientX;
		this.lastY = event.clientY;
	}

	_onMouseMove(event) {
		if (!this.isDragging) return;

		this.deltaX = event.clientX - this.lastX;
		this.deltaY = event.clientY - this.lastY;

		this.lastX = event.clientX;
		this.lastY = event.clientY;
	}

	_onMouseUp() {
		this.isDragging = false;
	}

	_onMouseLeave() {
		this.isDragging = false;
	}

	getDeltas() {
		const deltas = {
			deltaX: this.deltaX,
			deltaY: this.deltaY,
			isDragging: this.isDragging
		};

		// Reset deltas after retrieval
		this.deltaX = 0;
		this.deltaY = 0;

		return deltas;
	}
}

export default MouseInput;