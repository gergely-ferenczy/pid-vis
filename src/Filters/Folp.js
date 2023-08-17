export default class {

    static title = "First order low pass filter";

    constructor(params, samplingTime) {
        this.a = params.a;
        this.dt = samplingTime;
        this.y = 0;
    }

    tf(u) {
        const { a, dt, y: y_prev } = this;
        //const { w, dt, y: y_prev } = this;
        //const a = Math.exp(-w*dt);
        let y = a * y_prev + (1-a) * u;
        this.y = y;
        return y;
    }

    static get paramDefinitions() {
        return [
            {
                name: 'w',
                title: '\\omega',
                description: 'Delay',
                min: 0.0,
                max: 100000.0,
                step: 100.0
            }
        ];
    }

    static get defaultParams() {
        return {
            a: 0.0
        };
    }
}