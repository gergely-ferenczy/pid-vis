export default class {

    static title = "Water tank level";

    constructor(flowRate, baseArea, samplingTime) {
        this.c = flowRate;
        this.A = baseArea;
        this.dt = samplingTime;
        this.y = 0.0;
        this.u = 0.0;
    }

    tf(u) {
        const { c, A, dt, u: u_prev, y: y_prev } = this;
        u = Math.min(Math.max(u, 0.0), 100.0);
        const y = c / A * dt / 2 * (u + u_prev) + y_prev;
        this.y = y;
        this.u = u;
        return y;
    }

    static get paramDefinitions() {
        return [
            {
                name: 'c',
                title: 'c',
                description: 'Maximum inlet valve flow rate [l/s]',
                min: 0.0,
                max: 10.0,
                step: 0.1
            },
            {
                name: 'A',
                title: 'A',
                description: 'Water tank base area [m2]',
                min: 0.0,
                max: 2.0,
                step: 0.1
            }
        ];
    }

    static get defaultParams() {
        return {
            c: 1.0,
            A: 1.0
        };
    }
}