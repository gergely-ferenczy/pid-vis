export default class {

    static title = "Water tank level";

    constructor(params, samplingTime) {
        this.c = params.c;
        this.A = params.A;
        this.dt = samplingTime;
        this.y = 0.0;
        this.u = 0.0;
    }

    tf(u) {
        const { c, A, dt, u: u_prev, y: y_prev } = this;
        u = Math.min(Math.max(u, 0.0), 100.0);
        const y = c / 1000 / A * dt / 2 * (u + u_prev) + y_prev;
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
                min: 0.1,
                max: 20.0,
                step: 0.1
            },
            {
                name: 'A',
                title: 'A',
                description: 'Water tank base area [m2]',
                min: 0.005,
                max: 0.02,
                step: 0.005
            }
        ];
    }

    static get defaultParams() {
        return {
            c: 10.0,
            A: 0.01,
            control: {
                Kc: 0.4,
                Ti: 0.0,
                Td: 0.0,
                u_min: 0.0,
                u_max: 1.0
            }
        };
    }
}