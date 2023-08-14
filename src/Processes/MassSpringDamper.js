export default class {

    static title = "Mass spring damper";

    constructor(params, samplingTime) {
        this.F = params.F;
        this.k = params.k;
        this.d = params.d;
        this.m = params.m;
        this.dt = samplingTime;
        this.ua = Array(3).fill(0);
        this.ya = [0.0, 0.0];
    }

    tf(u) {
        const { F, k, d, m, dt, ua, ya } = this;
        ua.splice(0, 1);
        ua.push(u * F / m);

        const w = Math.sqrt(k/m);
        const Z = d / (2*m*w);

        const a = 4 / (dt*dt);
        const b = 4*Z*w / dt;
        const c = w*w;
        let y = ((ua[2] + 2*ua[1] + ua[0]) - ya[1] * (-a*2 + 2) - ya[0] * (a - b + c)) / (a + b + c);
        ya[0] = ya[1];
        ya[1] = y;
        return y;
    }

    static get paramDefinitions() {
        return [
            {
                name: 'F',
                title: 'F',
                description: 'External force',
                min: 0.1,
                max: 10.0,
                step: 0.1
            },
            {
                name: 'k',
                title: 'k',
                description: 'Spring constant',
                min: 0.1,
                max: 10.0,
                step: 0.1
            },
            {
                name: 'd',
                title: 'd',
                description: 'Dampening factor',
                min: 0.0,
                max: 10.0,
                step: 0.1
            },
            {
                name: 'm',
                title: 'm',
                description: 'Mass',
                min: 0.1,
                max: 10.0,
                step: 0.1
            }
        ];
    }

    static get defaultParams() {
        return {
            F: 1.0,
            k: 1.0,
            d: 1.0,
            m: 1.0,
            control: {
                Kc: 0.1,
                Ti: 3.5,
                Td: 1.5,
                u_min: -10.0,
                u_max: 10.0
            }
        };
    }
}