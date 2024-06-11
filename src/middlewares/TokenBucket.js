class TokenBucket {
    constructor(rate, capacity) {
        this.tokens = capacity;
        this.capacity = capacity;
        this.dripRate = rate;
        this.lastDrip = Date.now();

        setInterval(() => this.dripTokens(), 1000 / this.dripRate);
    }

    dripTokens() {
        const now = Date.now();
        const elapsedTime = now - this.lastDrip;

        this.lastDrip = now;
        this.tokens += elapsedTime * this.dripRate;

        // Check if tokens exceed capacity
        if (this.tokens > this.capacity) {
            this.tokens = this.capacity;
        }
    }

    consume(count = 1) {
        if (count > this.tokens) {
            return false; // Cannot consume more tokens than available
        } else {
            this.tokens -= count;
            return true; // Tokens successfully consumed
        }
    }
}

const bucket = new TokenBucket(2, 10)
module.exports.bucket = bucket;