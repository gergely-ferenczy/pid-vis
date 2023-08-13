export default class {
    constructor(gain, timeConstant, delay, samplingTime) {
        this.Kp = gain;
        this.Tc = timeConstant;
        this.d = delay;
        this.dt = samplingTime;
        this.ua = Array(Math.floor(delay / samplingTime) + 2).fill(0);
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
}