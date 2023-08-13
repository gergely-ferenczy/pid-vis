export default class {

    static title = "First order plus dead time";

    constructor(params, samplingTime) {
        this.Kp = params.Kp;
        this.Tc = params.Tc;
        this.d = params.d;
        this.dt = samplingTime;
        this.ua = Array(Math.floor(params.d / samplingTime) + 2).fill(0);
        this.y = 0;
    }

    tf(u) {
        const { Kp, Tc, dt, ua, y: y_prev } = this;
        ua.splice(0, 1);
        ua.push(u);
        let y = 1 / (2 * Tc + dt) * (Kp * dt * (ua[0] + ua[1]) - (dt - 2 * Tc) * y_prev);
        this.y = y;
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
            d: 1.0,
            control: {
                Kc: 0.4,
                Ti: 1.3,
                Td: 0.0,
                u_min: -10.0,
                u_max: 10.0
            }
        };
    }
}