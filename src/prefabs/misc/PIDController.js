export class PIDController{
	constructor(p, i, d){
        this.m_gainP = p;
        this.m_gainI = i;
        this.m_gainD = d;

        this.m_currentError = 0;
        this.m_previousError = 0;
        this.m_integral = 0;
        this.m_output = 0;
	}
    setError(e) { 
        this.m_currentError = e;
    }

    step(dt) {
        this.m_integral = dt * (this.m_integral + this.m_currentError);
        if(this.m_integral === Number.POSITIVE_INFINITY || this.m_integral === -Number.POSITIVE_INFINITY) this.m_integral = 0;
        const derivative = (1/dt) * (this.m_currentError - this.m_previousError);
        this.m_output = this.m_gainP * this.m_currentError + this.m_gainI * this.m_integral + this.m_gainD * derivative;
        this.m_previousError = this.m_currentError;
    }
    getOutput() {
        return this.m_output;
    }
}
