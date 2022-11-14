export function propertyDescriptor(value: unknown): PropertyDescriptor {
    return {
        enumerable: false,
        configurable: false,
        writable: false,
        value,
    };
}
