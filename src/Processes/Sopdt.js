export default class {

    static title = "Second order plus dead time";

    constructor(params, samplingTime) {
        this.Kp = params.Kp;
        this.Tc = params.Tc;
        this.Z = params.Z;
        this.d = params.d;
        this.dt = samplingTime;
        this.ua = Array(Math.floor(params.d / samplingTime) + 3).fill(0);
        this.ya = [0.0, 0.0];
    }

    tf(u) {
        const { Kp, Tc, Z, dt, ua, ya } = this;
        ua.splice(0, 1);
        ua.push(u);

        const a = 4*Tc*Tc / (dt*dt);
        const b = 4*Z*Tc / dt;
        let y = (Kp * (ua[2] + 2*ua[1] + ua[0]) - ya[1] * (-a*2 + 2) - ya[0] * (a - b + 1)) / (a + b + 1);
        ya[0] = ya[1];
        ya[1] = y;
        return y;
    }

    static get paramDefinitions() {
        return [
            {
                name: 'Kp',
                title: 'K_p',
                description: 'Gain',
                min: 0.1,
                max: 10.0,
                step: 0.1
            },
            {
                name: 'Tc',
                title: '\\tau_c',
                description: 'Time constant',
                min: 0.0,
                max: 10.0,
                step: 0.1
            },
            {
                name: 'Z',
                title: '\\zeta',
                description: 'Dampening factor',
                min: 0.0,
                max: 10.0,
                step: 0.1
            },
            {
                name: 'd',
                title: '\\theta_p',
                description: 'Delay',
                min: 0.0,
                max: 10.0,
                step: 0.1
            }
        ];
    }

    static get defaultParams() {
        return {
            Kp: 1.0,
            Tc: 0.6,
            Z: 0.2,
            d: 0.5,
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