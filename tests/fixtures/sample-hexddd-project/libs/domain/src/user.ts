// Sample domain entity for HexDDD migration testing
export class User {
    constructor(
        public readonly id: string,
        public readonly name: string,
        public readonly email: string
    ) { }

    validate(): boolean {
        return this.email.includes('@');
    }
}
